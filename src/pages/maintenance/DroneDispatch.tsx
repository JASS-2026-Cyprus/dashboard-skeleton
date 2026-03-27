import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './maintenance.module.css';

const STAGES = [
  { icon: '🛸', label: 'Drone dispatched — navigating to location', sub: 'Calculating optimal flight path…', duration: 5000 },
  { icon: '📹', label: 'Drone on-site — capturing footage', sub: 'Recording visual data of the reported area…', duration: 6000 },
  { icon: '📡', label: 'Footage secured — transmitting to server', sub: 'Uploading compressed video stream…', duration: 3000 },
  { icon: '🔬', label: 'Visual Intelligence pipeline ready', sub: 'Upload drone footage to begin AI analysis', duration: null as number | null },
];

interface Props {
  onFootageReady: (file: File) => void;
}

export default function DroneDispatch({ onFootageReady }: Props) {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const startTime = useRef(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Elapsed time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stage progression
  useEffect(() => {
    const stage = STAGES[currentStage];
    if (!stage || stage.duration === null) return;

    setStageProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / stage.duration!);
      setStageProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        setCompletedStages((prev) => new Set(prev).add(currentStage));
        setCurrentStage((prev) => prev + 1);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentStage]);

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
              {!isLast && isActive && (
                <div className={styles.msProgress}>
                  <div className={styles.msBar} style={{ width: `${stageProgress * 100}%` }} />
                </div>
              )}
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
    </div>
  );
}
