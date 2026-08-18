// ===========================================
// Types: Authentication
// ===========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "USER";
  name: string;
}

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    department: string;
    position: string;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
  };
}
