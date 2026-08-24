export interface LoginTypes {
  email: string;
  password: string;
}

export interface ProtectedRouteTypes {
  children: React.ReactNode;
  stepNeeded: number;
}

export interface APIResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: any;
}

export interface UserTypes {
  adminId: string;
  token: string;
  fullName: string;
}

export interface emailType {
  email: string;
}

export interface otpType {
  otp: number;
}

export interface ResetPasswordTypes {
  email?: string;
  password?: string;
  confirmPassword?: string;
  reference_code?: string;
  otp?: number;
}
