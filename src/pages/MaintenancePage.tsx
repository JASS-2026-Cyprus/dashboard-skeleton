import { useState, useEffect, useCallback } from 'react';
import { subscribeReports, type Report } from './maintenance/firebase';
import AnalysisTab from './maintenance/AnalysisTab';
import ReportsTab from './maintenance/ReportsTab';
import DashboardTab from './maintenance/DashboardTab';
import Toast from './maintenance/Toast';
import styles from './maintenance/maintenance.module.css';

type Tab = 'analysis' | 'reports' | 'dashboard';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsub = subscribeReports(setReports);
    return unsub;
  }, []);

  const handleToastClick = useCallback((reportId: string) => {
    setActiveTab('reports');
    // ReportsTab will handle selection via its own state
    void reportId;
  }, []);

  return (
    <div className={styles.pageWrap}>
      <Toast reports={reports} onClickReport={handleToastClick} />

      <div className={styles.tabs}>
        {(['analysis', 'reports', 'dashboard'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'analysis' ? 'Analysis' : tab === 'reports' ? 'Reports' : 'Dashboard'}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'analysis' && <AnalysisTab />}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} />
        )}
        {activeTab === 'dashboard' && <DashboardTab reports={reports} />}
      </div>
    </div>
  );
}
