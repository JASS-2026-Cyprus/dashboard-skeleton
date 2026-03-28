import React, { useState, useCallback } from 'react';
import { useMaintenanceReports } from '../hooks/useMaintenanceReports';
import AnalysisTab from './maintenance/AnalysisTab';
import ReportsTab from './maintenance/ReportsTab';
import DashboardTab from './maintenance/DashboardTab';
import Toast from './maintenance/Toast';
import styles from './maintenance/maintenance.module.css';

type Tab = 'dashboard' | 'reports' | 'analysis';

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  reports: 'Reports',
  analysis: 'Analysis',
};

function DashboardIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1.5" />
      <line x1="5" y1="5" x2="11" y2="5" />
      <line x1="5" y1="8" x2="11" y2="8" />
      <line x1="5" y1="11" x2="8" y2="11" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,12 5,7 8,9 11,4 15,4" />
      <circle cx="15" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const TAB_ICONS: Record<Tab, () => React.ReactElement> = {
  dashboard: DashboardIcon,
  reports: ReportsIcon,
  analysis: AnalysisIcon,
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { reports } = useMaintenanceReports();

  const handleStartAnalysisFromReport = useCallback((_file: File, _reportId: string) => {
    setActiveTab('analysis');
  }, []);

  const handleToastClick = useCallback((reportId: string) => {
    setActiveTab('reports');
    void reportId;
  }, []);

  return (
    <div className={styles.pageWrap}>
      <Toast reports={reports} onClickReport={handleToastClick} />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Maintenance</h1>
        <p className={styles.pageSubtitle}>City infrastructure monitoring and drone dispatch</p>
      </div>

      <div className={styles.tabs}>
        {(['dashboard', 'reports', 'analysis'] as Tab[]).map((tab) => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <Icon />
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div className={styles.tabContent}>
        <div style={{ display: activeTab === 'analysis' ? undefined : 'none' }}>
          <AnalysisTab />
        </div>
        <div style={{ display: activeTab === 'reports' ? undefined : 'none' }}>
          <ReportsTab reports={reports} onStartAnalysis={handleStartAnalysisFromReport} />
        </div>
        <div style={{ display: activeTab === 'dashboard' ? undefined : 'none' }}>
          <DashboardTab reports={reports} />
        </div>
      </div>
    </div>
  );
}
