import { useState, useCallback, useRef } from 'react';
import { runAnalysis, type AnalysisJob, type VlmLogEntry, type VlmResults } from './vlm';
import VlmTerminal from './VlmTerminal';
import TaskCards from './TaskCards';
import ConfidenceChart from './ConfidenceChart';
import RiskBanner from './RiskBanner';
import styles from './maintenance.module.css';

export default function AnalysisTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeJob = jobs.find((j) => j.id === activeJobId) || null;

  const startAnalysis = useCallback(
    async (file: File, reportId?: string) => {
      const jobId = crypto.randomUUID().slice(0, 8);
      const job: AnalysisJob = {
        id: jobId,
        videoName: file.name,
        startedAt: Date.now(),
        status: 'queued',
        message: 'Queued…',
        vlm: null,
        vlmLog: [],
        reportId,
      };

      setJobs((prev) => [job, ...prev]);
      setActiveJobId(jobId);

      try {
        await runAnalysis(file, {
          onStatusChange: (status, message) => {
            setJobs((prev) =>
              prev.map((j) => (j.id === jobId ? { ...j, status, message } : j)),
            );
          },
          onLog: (entry: VlmLogEntry) => {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === jobId ? { ...j, vlmLog: [...j.vlmLog, entry] } : j,
              ),
            );
          },
          onVlmResult: (results: VlmResults) => {
            setJobs((prev) =>
              prev.map((j) => (j.id === jobId ? { ...j, vlm: results } : j)),
            );
          },
        });
      } catch {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: 'error', message: 'Analysis failed' } : j,
          ),
        );
      }
    },
    [],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleUploadClick = useCallback(() => {
    if (selectedFile) {
      startAnalysis(selectedFile);
      setSelectedFile(null);
    }
  }, [selectedFile, startAnalysis]);

  const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
    queued: { cls: styles.badgeRunning, label: '⏳ Queued' },
    running_vlm: { cls: styles.badgeRunning, label: '🧠 VLM running…' },
    complete: { cls: styles.badgeDone, label: '✅ Complete' },
    error: { cls: styles.badgeError, label: '❌ Error' },
  };

  return (
    <>
      {/* Upload area */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Video Analysis</h2>
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneDragOver : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className={styles.dropIcon}>📹</div>
          <div className={styles.dropLabel}>Drop video file or click to browse</div>
          <div className={styles.dropHint}>.mp4, .avi, .mkv, .mov, .webm — max 500 MB</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.avi,.mkv,.mov,.webm"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setSelectedFile(f);
          }}
        />
        {selectedFile && (
          <div className={styles.selectedFile}>
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
          </div>
        )}
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={!selectedFile}
          onClick={handleUploadClick}
        >
          Analyse Video
        </button>
      </div>

      {/* Job list */}
      {jobs.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Analysis Jobs</h2>
          {jobs.map((job) => {
            const badge = STATUS_BADGE[job.status] || STATUS_BADGE.queued;
            return (
              <div
                key={job.id}
                className={styles.jobCard}
                style={{ cursor: 'pointer', borderColor: job.id === activeJobId ? 'var(--color-blue)' : undefined }}
                onClick={() => setActiveJobId(job.id)}
              >
                <div className={styles.jobName}>{job.videoName}</div>
                <div className={styles.jobRow}>
                  {job.status === 'running_vlm' || job.status === 'queued' ? (
                    <span className={styles.spinner} />
                  ) : null}
                  <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active job results */}
      {activeJob && (
        <>
          <RiskBanner vlm={activeJob.vlm} running={activeJob.status === 'running_vlm'} />

          {activeJob.vlmLog.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>VLM Pipeline Log</h2>
              <VlmTerminal
                logs={activeJob.vlmLog}
                showCursor={activeJob.status === 'running_vlm'}
              />
            </div>
          )}

          {activeJob.vlm && (
            <>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Detection Results</h2>
                <TaskCards vlm={activeJob.vlm} />
              </div>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Confidence Over Time</h2>
                <ConfidenceChart vlm={activeJob.vlm} />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
