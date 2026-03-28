import { useState, useEffect, useRef, useCallback } from 'react';
import { squarePattern, returnToBase } from './droneApi';
import styles from './maintenance.module.css';

interface StageConfig {
  icon: string;
  label: string;
  sub: string;
}

const STAGES: StageConfig[] = [
  { icon: '📹', label: 'Capturing footage — running scan pattern', sub: 'Executing square pattern at target location…' },
  { icon: '📡', label: 'Returning to base', sub: 'Flying back to starting position and landing…' },
  { icon: '🔬', label: 'Visual Intelligence pipeline ready', sub: 'Upload drone footage to begin AI analysis' },
];

interface Props {
  onFootageReady: (file: File) => void;
}

export default function DroneDispatch({ onFootageReady }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [stageError, setStageError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const startTime = useRef(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);

  // Elapsed time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Run API-driven stages sequentially
  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    (async () => {
      // Stage 0: square pattern
      try {
        await squarePattern(1.0);
        setCompletedStages((prev) => new Set(prev).add(0));
        setCurrentStage(1);
      } catch (e) {
        setStageError(e instanceof Error ? e.message : 'Square pattern failed');
        return;
      }

      // Stage 1: return to base
      try {
        await returnToBase();
        setCompletedStages((prev) => new Set(prev).add(1));
        setCurrentStage(2);
      } catch (e) {
        setStageError(e instanceof Error ? e.message : 'Return to base failed');
      }
    })();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    },
    [],
  );

  const handleAnalyse = useCallback(() => {
    if (selectedFile) onFootageReady(selectedFile);
  }, [selectedFile, onFootageReady]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div className={styles.missionPanel}>
      <div className={styles.missionHeader}>
        <span className={styles.missionTitle}>Drone Mission Active</span>
        <span className={styles.missionTime}>{minutes}:{seconds}</span>
      </div>

      {STAGES.map((stage, i) => {
        if (i > currentStage && !completedStages.has(i)) return null;
        const isDone = completedStages.has(i);
        const isActive = i === currentStage;
        const isLast = i === STAGES.length - 1;

        return (
          <div key={i} className={`${styles.missionStep} ${isDone ? styles.stepDone : ''}`}>
            <span className={styles.msIcon}>{stage.icon}</span>
            <div className={styles.msBody}>
              <div className={styles.msLabel}>{stage.label}</div>
              <div className={styles.msSub}>{isDone ? 'Complete' : stage.sub}</div>
              {isLast && isActive && (
                <div className={styles.droneUploadArea}>
                  <label className={styles.droneFileBtn} onClick={() => fileInputRef.current?.click()}>
                    Choose Video File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp4,.avi,.mkv,.mov,.webm"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <span className={styles.droneFileName}>
                    {selectedFile
                      ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)`
                      : 'No file selected'}
                  </span>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={!selectedFile}
                    onClick={handleAnalyse}
                  >
                    Analyse Footage
                  </button>
                </div>
              )}
            </div>
            <span className={styles.msCheck}>
              {isDone ? '✅' : isActive && !isLast ? <span className={styles.spinner} /> : ''}
            </span>
          </div>
        );
      })}

      {stageError && (
        <div style={{ marginTop: '0.75rem', fontSize: 13, color: '#c53030' }}>
          Mission error: {stageError}
        </div>
      )}
    </div>
  );
}
