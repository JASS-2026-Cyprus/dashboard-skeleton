import { useEffect, useRef, useState } from 'react';
import { subscribeDroneStream, getDroneStream, type DroneStreamStatus } from './firebase';
import styles from './maintenance.module.css';

const RECONNECT_DELAY = 3000;

async function startWhep(
  whepUrl: string,
  video: HTMLVideoElement,
  signal: AbortSignal,
  onError: (msg: string) => void,
  onPlaying: () => void,
): Promise<RTCPeerConnection | null> {
  try {
    const pc = new RTCPeerConnection();

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.ontrack = (evt) => {
      video.srcObject = evt.streams[0];
      video.play().catch(() => {});
      onPlaying();
    };

    pc.onconnectionstatechange = () => {
      if (signal.aborted) return;
      const state = pc.connectionState;
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        onError('Stream interrupted — reconnecting…');
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const res = await fetch(whepUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp,
      signal,
    });

    if (!res.ok) {
      pc.close();
      onError(`WHEP error: ${res.status}`);
      return null;
    }

    const answerSdp = await res.text();
    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    return pc;
  } catch (err) {
    if (!signal.aborted) onError('Failed to connect WebRTC stream');
    return null;
  }
}

export default function DroneStreamCard() {
  const [droneStatus, setDroneStatus] = useState<DroneStreamStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const unsub = subscribeDroneStream(setDroneStatus);
    return unsub;
  }, []);

  // Set up / tear down WebRTC when stream changes
  const whepUrl = droneStatus?.whep_url ?? null;
  const isLive = droneStatus?.status === 'streaming' && !!whepUrl;

  useEffect(() => {
    // Cleanup previous connection
    abortRef.current?.abort();
    pcRef.current?.close();
    pcRef.current = null;

    setVideoPlaying(false);
    if (!isLive || !whepUrl) return;

    const ac = new AbortController();
    abortRef.current = ac;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      const video = videoRef.current;
      if (!video || ac.signal.aborted) return;

      setVideoError(null);
      const pc = await startWhep(
        whepUrl,
        video,
        ac.signal,
        (msg) => {
          if (ac.signal.aborted) return;
          setVideoError(msg);
          pcRef.current?.close();
          pcRef.current = null;
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            if (!ac.signal.aborted) connect();
          }, RECONNECT_DELAY);
        },
        () => { setVideoError(null); setVideoPlaying(true); },
      );
      if (pc && !ac.signal.aborted) {
        pcRef.current = pc;
      }
    };

    // Small delay to ensure video element is mounted after render
    const initTimer = setTimeout(connect, 100);

    return () => {
      ac.abort();
      clearTimeout(initTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [isLive, whepUrl]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const status = await getDroneStream();
      setDroneStatus(status);
    } finally {
      setRefreshing(false);
    }
  };

  const copyRtsp = () => {
    if (droneStatus?.rtsp_url) {
      navigator.clipboard.writeText(droneStatus.rtsp_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.streamCardHeader}>
        <div className={styles.streamCardTitle}>
          <span className={styles.streamDroneIcon}>🚁</span>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Drone Live Stream</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {droneStatus === null ? (
            <span className={`${styles.badge} ${styles.badgeRunning}`}>Connecting…</span>
          ) : isLive ? (
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </span>
          ) : (
            <span className={styles.offlineBadge}>OFFLINE</span>
          )}
          <button
            className={`${styles.btn} ${styles.refreshBtn}`}
            onClick={handleRefresh}
            disabled={refreshing || droneStatus === null}
            title="Refresh stream status"
          >
            <span className={refreshing ? styles.refreshSpinning : ''}>↻</span>
          </button>
        </div>
      </div>

      <div className={styles.streamScreen}>
        {isLive && (
          <video
            ref={videoRef}
            className={styles.streamVideo}
            muted
            playsInline
            autoPlay
          />
        )}

        {isLive && !videoPlaying && !videoError && (
          <div className={styles.streamScreenCenter}>
            <span className={styles.spinner} />
            <div className={styles.streamOfflineText}>Connecting to WebRTC stream…</div>
          </div>
        )}

        {isLive && (
          <>
            <div className={styles.streamCornerTL} />
            <div className={styles.streamCornerTR} />
            <div className={styles.streamCornerBL} />
            <div className={styles.streamCornerBR} />

            <div className={styles.streamTopBar}>
              <span className={styles.liveBadgeSmall}>
                <span className={styles.liveDot} /> LIVE
              </span>
              {droneStatus.updated_at && (
                <span className={styles.streamTimestamp}>
                  {new Date(droneStatus.updated_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            {videoError && (
              <div className={styles.streamScreenCenter} style={{ zIndex: 4 }}>
                <div className={styles.streamOfflineIcon}>⚠️</div>
                <div className={styles.streamOfflineText} style={{ color: '#fbbf24' }}>{videoError}</div>
                <div className={styles.streamOfflineSub}>Attempting to reconnect…</div>
              </div>
            )}

            <div className={styles.streamBottomBar}>
              <div className={styles.streamRtspRow}>
                <span className={styles.streamRtspLabel}>WebRTC</span>
                <span className={styles.streamRtspAddr}>{droneStatus.rtsp_url}</span>
                <button className={styles.copyBtn} onClick={copyRtsp}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </>
        )}

        {droneStatus === null && (
          <div className={styles.streamScreenCenter}>
            <span className={styles.spinner} />
          </div>
        )}

        {droneStatus?.status === 'no_stream' && (
          <div className={styles.streamScreenCenter}>
            <div className={styles.streamOfflineIcon}>📡</div>
            <div className={styles.streamOfflineText}>No active drone stream</div>
            <div className={styles.streamOfflineSub}>
              Deploy the drone and register its RTSP address to begin streaming
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
