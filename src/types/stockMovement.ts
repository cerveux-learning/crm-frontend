export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    code: string;
    name: string;
    category?: string;
  } | null;
  type: StockMovementType;
  quantity: number;
  notes?: string | null;
  saleOrderId?: string | null;
  saleOrder?: {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    total: number;
  } | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateStockEntryInput {
  productId: string;
  quantity: number;
  notes?: string | null;
}
