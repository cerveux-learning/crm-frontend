import type { DealStage } from './deal.js';

export interface DashboardMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowthPercentage: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeDealsCount: number;
  dealsPipelineValue: number;
  dealsWonCount: number;
  dealsLostCount: number;
  winRate: number; // percentage
  averageTicket: number;
}

export interface MonthlySalesData {
  month: string;
  revenue: number;
  deals: number;
  invoices: number;
}

export interface DealsByStageData {
  stage: DealStage;
  label: string;
  count: number;
  totalValue: number;
  color: string;
}

export interface TopCustomerData {
  id: string;
  name: string;
  company: string | null;
  totalSpent: number;
  salesCount: number;
}

export interface TopProductData {
  id: string;
  name: string;
  code: string;
  unitsSold: number;
  totalRevenue: number;
}
