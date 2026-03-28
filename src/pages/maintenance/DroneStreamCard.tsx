import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { subscribeDroneStream, getDroneStream, type DroneStreamStatus } from './firebase';
import styles from './maintenance.module.css';

const HLS_PATH = '/stream/api/stream.m3u8?src=drone';

async function registerRtspSource(rtspUrl: string) {
  // go2rtc takes src as a query parameter, NOT in the body
  const url = `/stream/api/streams?name=drone&src=${encodeURIComponent(rtspUrl)}`;
  const res = await fetch(url, { method: 'PUT' });
  console.log('[drone] stream registration:', res.status, rtspUrl);
  // give go2rtc a moment to connect to the RTSP source
  await new Promise((r) => setTimeout(r, 2000));
}

async function clearRtspSource() {
  await fetch('/stream/api/streams?name=drone', { method: 'DELETE' }).catch(() => {});
}

export default function DroneStreamCard() {
  const [droneStatus, setDroneStatus] = useState<DroneStreamStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    const unsub = subscribeDroneStream(setDroneStatus);
    return unsub;
  }, []);

  // Set up / tear down HLS player when RTSP URL changes
  useEffect(() => {
    const rtspUrl = droneStatus?.rtsp_url ?? null;

    if (!rtspUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        clearRtspSource();
      }
      return;
    }

    setVideoError(null);

    registerRtspSource(rtspUrl).then(() => {
      const video = videoRef.current;
      if (!video) return;

      if (Hls.isSupported()) {
        hlsRef.current?.destroy();
        const hls = new Hls({
          liveSyncDuration: 2,
          liveMaxLatencyDuration: 6,
          lowLatencyMode: true,
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setVideoError('Drone unreachable — is it deployed and streaming?');
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setVideoError(null);
          video.play().catch(() => {});
        });
        hls.loadSource(HLS_PATH);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = HLS_PATH;
        video.play().catch(() => {});
      } else {
        setVideoError('HLS playback not supported in this browser.');
      }
    });

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [droneStatus?.rtsp_url]);

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

  const isLive = droneStatus?.status === 'streaming';

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
        {/* Actual video — only mounted when live so HLS doesn't initialise on a null element */}
        {isLive && (
          <video
            ref={videoRef}
            className={styles.streamVideo}
            muted
            playsInline
            autoPlay
          />
        )}

        {/* Overlays */}
        {isLive && (
          <>
            <div className={styles.streamScanlines} />
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
              <div className={styles.streamErrorOverlay}>{videoError}</div>
            )}

            <div className={styles.streamBottomBar}>
              <div className={styles.streamRtspRow}>
                <span className={styles.streamRtspLabel}>RTSP</span>
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
