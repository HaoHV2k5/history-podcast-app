export type RoleType = 'VIEWER' | 'CREATOR' | 'NARRATOR' | 'FREELANCER' | 'ADMIN';

export interface UserResponse {
  id: number;
  roleId?: number;
  roleName?: string;
  roles?: string[];
  isCreator?: boolean;
  isFreelancer?: boolean;
  isAdmin?: boolean;
  email: string;
  phone?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  phone?: string;
  role: string;
  roles?: string[];
}
