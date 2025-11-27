// Last Modified: 2025-11-23 17:30
import { api } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: string;
    isActive?: boolean;
    createdAt?: string;
  };
  // Tokens are set in httpOnly cookies AND returned in response
  // Response tokens are used for WebSocket authentication
  accessToken?: string;
  refreshToken?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// API endpoints for authentication
export const authApi = {
  // Login
  login: async (data: LoginRequest) => {
    return api.post<AuthResponse>('/auth/login', data);
  },

  // Register
  register: async (data: RegisterRequest) => {
    return api.post<AuthResponse>('/auth/register', data);
  },

  // Logout
  logout: async () => {
    return api.post('/auth/logout');
  },

  // Refresh token (refresh token is sent automatically via httpOnly cookie)
  refreshToken: async () => {
    return api.post<{ success: boolean }>('/auth/refresh', {});
  },

  // Get current user
  getCurrentUser: async () => {
    return api.get<AuthResponse['user']>('/auth/me');
  },

  // Update user profile
  updateProfile: async (data: Partial<{
    fullName: string;
    phoneNumber: string;
  }>) => {
    return api.patch<AuthResponse['user']>('/auth/profile', data);
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest) => {
    return api.post('/auth/forgot-password', data);
  },

  // Confirm password reset
  confirmPasswordReset: async (data: PasswordResetConfirm) => {
    return api.post('/auth/reset-password', data);
  },

  // Enable two-factor authentication
  enable2FA: async () => {
    return api.post<{
      secret: string;
      qrCode: string;
    }>('/auth/2fa/enable');
  },

  // Verify 2FA setup
  verify2FA: async (code: string) => {
    return api.post<{
      backupCodes: string[];
    }>('/auth/2fa/verify', { code });
  },

  // Disable 2FA
  disable2FA: async (password: string) => {
    return api.post('/auth/2fa/disable', { password });
  },

  // Verify email
  verifyEmail: async (token: string) => {
    return api.post('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: async () => {
    return api.post('/auth/resend-verification');
  },
};