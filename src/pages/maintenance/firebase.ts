import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDMqZ1Fg8WNWQQ16RCDwbml9GjongpVfic',
  authDomain: 'cityreporter-ea00d.firebaseapp.com',
  projectId: 'cityreporter-ea00d',
  storageBucket: 'cityreporter-ea00d.firebasestorage.app',
  messagingSenderId: '695186752306',
  appId: '1:695186752306:web:20b7449ead1cc744654d2b',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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

export async function updateReportStatus(reportId: string, status: string) {
  await updateDoc(doc(db, 'reports', reportId), { status });
}
