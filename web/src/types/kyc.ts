export type KycStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycProfile {
  id: number;
  userId: number;
  userEmail: string;
  fullName: string;
  phone?: string;
  contactEmail?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bio?: string;
  portfolioUrl?: string;
  verificationMethod: 'EMAIL' | 'PHONE' | string;
  otpVerifiedAt?: string;
  status: KycStatus | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SendEmailOtpRequest {
  email: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otpCode: string;
}

export interface SubmitKycRequest {
  fullName: string;
  phone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bio?: string;
  portfolioUrl?: string;
}

export interface UpdateKycStatusPayload {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface KycQueryParams {
  status?: string;
  page?: number;
  size?: number;
}

