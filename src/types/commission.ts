export type CommissionStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Commission {
  id: string;
  saleOrderId: string;
  userId?: string | null;
  customerName?: string | null;
  costSubtotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt?: string | null;
  paidByUserId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  saleOrder?: {
    id: string;
    orderNumber: string;
    issueDate: string;
    total: number;
    status: string;
  } | null;
  paidByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CommissionSummaryItem {
  amount: number;
  count: number;
}

export interface CommissionSellerBreakdown {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  totalAmount: number;
  count: number;
}

export interface CommissionSummary {
  totalGenerated: CommissionSummaryItem;
  pendingAmount: CommissionSummaryItem;
  paidAmount: CommissionSummaryItem;
  bySeller?: CommissionSellerBreakdown[];
}

export interface CommissionFilters {
  status?: 'ALL' | 'PENDING' | 'PAID' | 'CANCELLED';
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PayCommissionInput {
  notes?: string;
  paidAt?: string;
}

export interface BatchPayCommissionInput {
  ids: string[];
  notes?: string;
  paidAt?: string;
}

export interface BatchPayResult {
  updated: number;
  requested: number;
  skipped: number;
}
