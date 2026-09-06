import type { Customer } from './customer.js';
import type { Deal } from './deal.js';

export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE' | 'TASK';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  customerId?: string | null;
  customer?: Customer | null;
  dealId?: string | null;
  deal?: Deal | null;
  completed: boolean;
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string | null;
  customerId?: string | null;
  dealId?: string | null;
  completed?: boolean;
  dueDate?: string | Date | null;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {}
