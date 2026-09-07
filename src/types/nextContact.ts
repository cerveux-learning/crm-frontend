export interface NextContact {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  contactDate: string;
  done: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNextContactInput {
  customerId: string;
  userId?: string;
  contactDate: string;
  done?: boolean;
  notes?: string | null;
}

export interface UpdateNextContactInput {
  contactDate?: string;
  done?: boolean;
  notes?: string | null;
  userId?: string;
}
