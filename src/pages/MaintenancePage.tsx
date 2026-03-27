import { useState, useCallback } from 'react';
import { useMaintenanceReports } from '../hooks/useMaintenanceReports';
import AnalysisTab from './maintenance/AnalysisTab';
import ReportsTab from './maintenance/ReportsTab';
import DashboardTab from './maintenance/DashboardTab';
import Toast from './maintenance/Toast';
import styles from './maintenance/maintenance.module.css';

type Tab = 'analysis' | 'reports' | 'dashboard';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { reports } = useMaintenanceReports();

  const handleStartAnalysisFromReport = useCallback((_file: File, _reportId: string) => {
    // Switch to analysis tab — the AnalysisTab manages its own state
    setActiveTab('analysis');
  }, []);

  const handleToastClick = useCallback((reportId: string) => {
    setActiveTab('reports');
    // ReportsTab will handle selection via its own state
    void reportId;
  }, []);

  return (
    <>
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

      {activeTab === 'analysis' && <AnalysisTab />}
      {activeTab === 'reports' && (
        <ReportsTab reports={reports} onStartAnalysis={handleStartAnalysisFromReport} />
      )}
      {activeTab === 'dashboard' && <DashboardTab reports={reports} />}
    </>
  );
}
