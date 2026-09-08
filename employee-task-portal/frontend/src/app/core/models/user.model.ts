export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
