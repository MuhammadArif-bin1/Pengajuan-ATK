// ===========================================
// Types: User
// ===========================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  department: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
  department: string;
  position: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  role?: "ADMIN" | "USER";
}
