import type { Customer } from './customer.js';

export type DealStage = 
  | 'LEAD' 
  | 'QUALIFIED' 
  | 'PROPOSAL' 
  | 'NEGOTIATION' 
  | 'WON' 
  | 'LOST';

export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  priority: DealPriority;
  probability: number; // 0 to 100
  expectedCloseDate?: string | Date | null;
  customerId: string;
  customer?: Customer | null;
  userId?: string | null;
  user?: { id: string; name: string; email: string } | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateDealInput {
  title: string;
  value: number;
  currency?: string;
  stage?: DealStage;
  priority?: DealPriority;
  probability?: number;
  expectedCloseDate?: string | Date | null;
  customerId: string;
  userId?: string | null;
  notes?: string | null;
}

export interface UpdateDealInput extends Partial<CreateDealInput> {}

export interface UpdateDealStageInput {
  stage: DealStage;
}
