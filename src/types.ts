import type { ReactNode } from 'react';

export interface StatItem {
  label: string;
  value: string;
  success?: boolean;
}

export interface TeamWidgetProps {
  title: string;
  status: string;
  statusColor: 'blue' | 'green';
  description: string;
  stats: StatItem[];
  graph?: ReactNode;
  detailsLink?: string;
}

export interface SystemSummaryProps {
  action: string;
  urgency: string;
  state: string;
}

export interface LineGraphProps {
  data: number[];
  label: string;
  currentValue: string;
  color?: string;
}

export interface BarGraphProps {
  data: number[];
  label: string;
  currentValue: string;
  color?: string;
}
