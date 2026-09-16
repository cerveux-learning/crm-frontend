import type { Customer } from './customer.js';
import type { Product } from './product.js';

export type SaleStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'PAID' 
  | 'CANCELLED';

export type SaleType = 'QUOTE' | 'INVOICE';

export interface SaleOrderItem {
  id: string;
  saleOrderId: string;
  productId?: string | null;
  product?: Product | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  total: number;
}

export interface SaleOrder {
  id: string;
  orderNumber: string;
  type: SaleType;
  status: SaleStatus;
  customerId: string;
  customer?: Customer | null;
  userId?: string | null;
  user?: { id: string; name: string; email: string } | null;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  subtotal: number;
  taxRate: number; // e.g. 0.21 for 21%
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string | null;
  items: SaleOrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateSaleOrderItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateSaleOrderInput {
  orderNumber?: string;
  type: SaleType;
  status?: SaleStatus;
  customerId: string;
  userId?: string | null;
  issueDate?: string | Date;
  dueDate?: string | Date | null;
  taxRate?: number;
  discountAmount?: number;
  notes?: string | null;
  /** Disponible únicamente para facturas emitidas por administradores. */
  useCostPrice?: boolean;
  items: CreateSaleOrderItemInput[];
}

export interface UpdateSaleOrderInput extends Partial<Omit<CreateSaleOrderInput, 'items'>> {
  items?: CreateSaleOrderItemInput[];
}
