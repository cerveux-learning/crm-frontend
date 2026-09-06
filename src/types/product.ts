export type ProductCategory = 'PRODUCT' | 'SERVICE' | 'SUBSCRIPTION' | 'OTHER';

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: ProductCategory;
  unitPrice: number;
  cost?: number | null;
  stock: number;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string | null;
  category?: ProductCategory;
  unitPrice: number;
  cost?: number | null;
  stock?: number;
  active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}
