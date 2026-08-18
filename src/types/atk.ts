// ===========================================
// Types: ATK Item
// ===========================================

export interface AtkItemData {
  id: string;
  name: string;
  description: string | null;
  stock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtkItemInput {
  name: string;
  description?: string;
  stock: number;
  unit: string;
}

export interface UpdateAtkItemInput {
  name?: string;
  description?: string;
  stock?: number;
  unit?: string;
}
