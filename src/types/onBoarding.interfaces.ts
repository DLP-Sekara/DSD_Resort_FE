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

export interface SendOtpTypes {
  email: string;
}

export interface VerifyOtpTypes {
  email: string;
  otp: string;
}

export interface ResetPasswordPayloadTypes {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordTypes {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


