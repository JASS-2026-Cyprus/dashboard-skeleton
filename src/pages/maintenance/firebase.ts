import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  onSnapshot,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';

export interface DroneStreamStatus {
  status: 'streaming' | 'no_stream';
  rtsp_url: string | null;
  updated_at?: string;
}

const firebaseConfig = {
  apiKey: 'AIzaSyDMqZ1Fg8WNWQQ16RCDwbml9GjongpVfic',
  authDomain: 'cityreporter-ea00d.firebaseapp.com',
  projectId: 'cityreporter-ea00d',
  storageBucket: 'cityreporter-ea00d.firebasestorage.app',
  messagingSenderId: '695186752306',
  appId: '1:695186752306:web:20b7449ead1cc744654d2b',
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export interface Report {
  id: string;
  title: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  address: string;
  lat: number | null;
  lng: number | null;
  reportedBy: string;
  photos: string[];
  createdAt: string;
  status: 'pending' | 'in_progress' | 'resolved';
  description?: string;
  roomX?: number;
  roomY?: number;
}

export function subscribeReports(callback: (reports: Report[]) => void) {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports: Report[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as DocumentData;
      reports.push({ id: d.id, ...data } as Report);
    });
    callback(reports);
  });
}

export async function updateReportStatus(
  reportId: string,
  status: Report['status'],
) {
  await updateDoc(doc(db, 'reports', reportId), { status });
}

export async function getDroneStream(): Promise<DroneStreamStatus> {
  const snap = await getDoc(doc(db, 'drone_status', 'current'));
  if (!snap.exists()) return { status: 'no_stream', rtsp_url: null };
  const data = snap.data() as DocumentData;
  const rtsp_url: string | null = data.rtsp_url && typeof data.rtsp_url === 'string' && data.rtsp_url.startsWith('rtsp://') ? data.rtsp_url : null;
  return { status: rtsp_url ? 'streaming' : 'no_stream', rtsp_url, updated_at: data.updated_at };
}

export function subscribeDroneStream(callback: (status: DroneStreamStatus) => void) {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const result = await getDroneStream();
      if (!cancelled) callback(result);
    } catch {
      if (!cancelled) callback({ status: 'no_stream', rtsp_url: null });
    }
  };

  poll();
  const id = setInterval(poll, 5_000);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
