// ===========================================
// Types: ATK Request
// ===========================================

export type RequestStatusType =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "DIPROSES"
  | "SELESAI";

export interface AtkRequestData {
  id: string;
  userId: string;
  atkItemId: string;
  quantity: number;
  reason: string;
  status: RequestStatusType;
  adminNote: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    department: string;
    position: string;
  };
  atkItem: {
    id: string;
    name: string;
    unit: string;
    stock?: number;
  };
  processor?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateRequestInput {
  atkItemId: string;
  quantity: number;
  reason: string;
}

export interface UpdateRequestStatusInput {
  status: RequestStatusType;
  adminNote?: string;
}

export interface RequestFilters {
  status?: RequestStatusType;
  department?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
