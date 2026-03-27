import { useEffect, useRef } from 'react';
import type { VlmLogEntry } from './vlm';
import styles from './maintenance.module.css';

function lineClass(msg: string): string {
  if (/Pipeline started/.test(msg)) return styles.lStart;
  if (/Processing window/.test(msg)) return styles.lWindow;
  if (/POSITIVE/.test(msg)) return styles.lPos;
  if (/\bnegative\b/.test(msg)) return styles.lNeg;
  if (/PARSE_ERROR|parse_error/.test(msg)) return styles.lWarn;
  if (/ERROR|error/.test(msg)) return styles.lError;
  if (/Pipeline complete/.test(msg)) return styles.lDone;
  return '';
}

interface Props {
  logs: VlmLogEntry[];
  showCursor?: boolean;
}

export default function VlmTerminal({ logs, showCursor = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className={styles.terminal} ref={ref}>
      {logs.map((entry, i) => (
        <div key={i} className={`${styles.tline} ${lineClass(entry.msg)}`}>
          <span className={styles.ttime}>{entry.t}</span>
          <span className={styles.tmsg}>{entry.msg}</span>
        </div>
      ))}
      {showCursor && <span className={styles.cursor} />}
    </div>
  );
}
