import { useState, useEffect } from 'react';
import { subscribeReports, type Report } from '../pages/maintenance/firebase';

export function useMaintenanceReports(): { reports: Report[] } {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    const unsub = subscribeReports(setReports);
    return unsub;
  }, []);
  return { reports };
}
