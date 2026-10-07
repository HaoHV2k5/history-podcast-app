export interface KycProfile {
  id: number;
  userId: number;
  userEmail: string;
  fullName: string;
  phone?: string;
  contactEmail?: string;
  bio?: string;
  portfolioUrl?: string;
  verificationMethod: 'EMAIL' | 'PHONE' | string;
  otpVerifiedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  // Note: Financial fields (bankName, bankAccountNumber) intentionally excluded from default KYC display per Mandatory Correction 2
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
