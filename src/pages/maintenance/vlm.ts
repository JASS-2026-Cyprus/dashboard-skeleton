/**
 * VLM client — extracts frames from video and calls the VLM API directly.
 * Uses Vite dev proxy (/api/vlm) to avoid CORS and keep the API key server-side.
 */

// ── Types ──

export interface VlmLogEntry {
  t: string;
  msg: string;
  lvl: 'INFO' | 'WARN' | 'ERROR';
}

export interface TaskFinding {
  timestamps: number[];
  answer: string;
  confidence: number;
}

export interface TaskResult {
  any_positive: boolean;
  positive_windows: number;
  total_windows: number;
  confidence_mean: number;
  findings: TaskFinding[];
}

export interface VlmResults {
  waste_detection_v1: TaskResult;
  fire_smoke_v1: TaskResult;
  structural_crack_v1: TaskResult;
}

export type JobStatus = 'queued' | 'running_vlm' | 'complete' | 'error';

export interface AnalysisJob {
  id: string;
  videoName: string;
  startedAt: number;
  status: JobStatus;
  message: string;
  vlm: VlmResults | null;
  vlmLog: VlmLogEntry[];
  reportId?: string;
}

// ── Task prompts ──

const TASKS = {
  waste_detection_v1: {
    prompt:
      'Analyze these surveillance frames for waste, litter, or trash on the ground. ' +
      'Look for plastic bags, bottles, paper, food waste, or any debris that should not be there. ' +
      'Respond with a JSON object: {"detected": true/false, "confidence": 0.0-1.0, "description": "brief description"}',
  },
  fire_smoke_v1: {
    prompt:
      'Analyze these surveillance frames for any signs of fire, smoke, flames, or burning. ' +
      'Look for visible flames, dark/gray smoke plumes, heat haze, or charred areas. ' +
      'Respond with a JSON object: {"detected": true/false, "confidence": 0.0-1.0, "description": "brief description"}',
  },
  structural_crack_v1: {
    prompt:
      'Analyze these surveillance frames for structural damage, cracks, or deterioration. ' +
      'Look for wall cracks, pavement damage, broken infrastructure, or structural deformation. ' +
      'Respond with a JSON object: {"detected": true/false, "confidence": 0.0-1.0, "description": "brief description"}',
  },
} as const;

type TaskId = keyof typeof TASKS;

// ── Frame extraction ──

function timestamp(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

async function extractFrames(
  file: File,
  fps: number = 0.5,
  maxShortSide: number = 1080,
): Promise<{ frames: string[]; timestamps: number[] }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const interval = 1 / fps;
      const times: number[] = [];
      for (let t = 0; t < duration; t += interval) {
        times.push(t);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Scale to max short side
      let w = video.videoWidth;
      let h = video.videoHeight;
      const shortSide = Math.min(w, h);
      if (shortSide > maxShortSide) {
        const scale = maxShortSide / shortSide;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;

      const frames: string[] = [];
      const frameTimestamps: number[] = [];

      for (const t of times) {
        try {
          video.currentTime = t;
          await new Promise<void>((res) => {
            video.onseeked = () => res();
          });
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          frames.push(dataUrl.split(',')[1]);
          frameTimestamps.push(t * 1000); // ms
        } catch {
          // skip frame
        }
      }

      URL.revokeObjectURL(url);
      resolve({ frames, timestamps: frameTimestamps });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

// ── VLM API call ──

async function callVlm(
  frames: string[],
  taskPrompt: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string> {
  const imageContent = frames.map((b64) => ({
    type: 'image_url' as const,
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: taskPrompt },
          ...imageContent,
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.1,
  };

  // Use proxy in dev, direct URL otherwise
  const url = baseUrl.startsWith('/') ? baseUrl : '/api/vlm';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VLM API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseVlmResponse(raw: string): { detected: boolean; confidence: number; description: string } {
  try {
    // Try to extract JSON from the response
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      const obj = JSON.parse(match[0]);
      return {
        detected: Boolean(obj.detected),
        confidence: Number(obj.confidence) || 0,
        description: String(obj.description || ''),
      };
    }
  } catch {
    // parse error
  }
  // Fallback: check for keywords
  const lower = raw.toLowerCase();
  const detected = lower.includes('detected') && !lower.includes('not detected');
  return { detected, confidence: detected ? 0.5 : 0.1, description: raw.slice(0, 130) };
}

// ── Main analysis runner ──

export interface AnalysisCallbacks {
  onStatusChange: (status: JobStatus, message: string) => void;
  onLog: (entry: VlmLogEntry) => void;
  onVlmResult: (results: VlmResults) => void;
}

export async function runAnalysis(
  file: File,
  callbacks: AnalysisCallbacks,
  config?: { apiKey?: string; baseUrl?: string; model?: string },
): Promise<VlmResults> {
  const apiKey = config?.apiKey || import.meta.env.VITE_VLM_API_KEY || '';
  const baseUrl = config?.baseUrl || '/api/vlm';
  const model = config?.model || 'Qwen3-VL-8B-Instruct';

  callbacks.onStatusChange('running_vlm', 'Extracting video frames…');
  callbacks.onLog({ t: timestamp(), msg: 'Pipeline started — extracting frames at 0.5 fps', lvl: 'INFO' });

  let frames: string[];
  let timestamps: number[];
  try {
    const result = await extractFrames(file, 0.5);
    frames = result.frames;
    timestamps = result.timestamps;
  } catch (e) {
    callbacks.onLog({ t: timestamp(), msg: `ERROR: Frame extraction failed — ${e}`, lvl: 'ERROR' });
    callbacks.onStatusChange('error', 'Frame extraction failed');
    throw e;
  }

  callbacks.onLog({
    t: timestamp(),
    msg: `Extracted ${frames.length} frames from ${(file.size / 1024 / 1024).toFixed(1)} MB video`,
    lvl: 'INFO',
  });

  // Create windows (size=4, stride=2)
  const windowSize = 4;
  const windowStride = 2;
  const windows: { frames: string[]; timestamps: number[] }[] = [];
  for (let i = 0; i <= frames.length - windowSize; i += windowStride) {
    windows.push({
      frames: frames.slice(i, i + windowSize),
      timestamps: timestamps.slice(i, i + windowSize),
    });
  }
  // If no full windows, use all frames as one window
  if (windows.length === 0 && frames.length > 0) {
    windows.push({ frames, timestamps });
  }

  callbacks.onLog({ t: timestamp(), msg: `Created ${windows.length} analysis windows`, lvl: 'INFO' });

  const taskIds = Object.keys(TASKS) as TaskId[];
  const results: Record<string, TaskResult> = {};

  for (const taskId of taskIds) {
    const task = TASKS[taskId];
    const taskLabel = taskId.replace(/_v1$/, '').replace(/_/g, ' ');
    callbacks.onLog({ t: timestamp(), msg: `Starting task: ${taskLabel}`, lvl: 'INFO' });

    const findings: TaskFinding[] = [];
    let positiveWindows = 0;

    for (let wi = 0; wi < windows.length; wi++) {
      const win = windows[wi];
      callbacks.onLog({
        t: timestamp(),
        msg: `Processing window ${wi + 1}/${windows.length} for ${taskLabel}`,
        lvl: 'INFO',
      });

      try {
        const raw = await callVlm(win.frames, task.prompt, apiKey, baseUrl, model);
        const parsed = parseVlmResponse(raw);

        if (parsed.detected) {
          positiveWindows++;
          findings.push({
            timestamps: win.timestamps,
            answer: parsed.description,
            confidence: parsed.confidence,
          });
          callbacks.onLog({ t: timestamp(), msg: `  → POSITIVE (${(parsed.confidence * 100).toFixed(0)}%): ${parsed.description}`, lvl: 'INFO' });
        } else {
          callbacks.onLog({ t: timestamp(), msg: `  → negative (${(parsed.confidence * 100).toFixed(0)}%)`, lvl: 'INFO' });
        }
      } catch (e) {
        callbacks.onLog({ t: timestamp(), msg: `  → ERROR: ${e}`, lvl: 'ERROR' });
      }
    }

    const confidences = findings.map((f) => f.confidence);
    results[taskId] = {
      any_positive: positiveWindows > 0,
      positive_windows: positiveWindows,
      total_windows: windows.length,
      confidence_mean: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
      findings,
    };

    callbacks.onLog({ t: timestamp(), msg: `Task ${taskLabel} complete — ${positiveWindows}/${windows.length} positive`, lvl: 'INFO' });
  }

  const vlmResults = results as unknown as VlmResults;
  callbacks.onLog({ t: timestamp(), msg: 'Pipeline complete', lvl: 'INFO' });
  callbacks.onStatusChange('complete', 'Analysis complete');
  callbacks.onVlmResult(vlmResults);
  return vlmResults;
}
