import type { NextContact } from './nextContact';

export type CustomerStatus = 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  status: CustomerStatus;
  address?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    deals?: number;
    sales?: number;
    activities?: number;
    nextContacts?: number;
  };
  nextContacts?: NextContact[];
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  status?: CustomerStatus;
  address?: string | null;
  tags?: string[];
  notes?: string | null;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> { }
