export interface AtkCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  stock: number;
  unit: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalNotificationItem {
  id: string;
  userName: string;
  department: string;
  position: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK" | "DIPROSES" | "SELESAI";
  adminNote: string | null;
  processedByName: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isPurchase: boolean;
  isMyRequest?: boolean;
}

export type StockStatusFilter = "ALL" | "READY" | "LOW" | "EMPTY";
export type QueueSortOrder = "NEWEST" | "OLDEST";
