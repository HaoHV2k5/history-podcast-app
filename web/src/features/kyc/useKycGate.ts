import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { kycApi } from '@/services/api/kyc';
import { KycProfile, KycStatus } from '@/types/kyc';

export type KycGateStatus = KycStatus | 'NO_PROFILE' | 'ERROR';

export interface UseKycGateResult {
  profile: KycProfile | null;
  status: KycGateStatus;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  hasNoProfile: boolean;
  rejectionReason?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  refetch: () => void;
}

export const useKycGate = (): UseKycGateResult => {
  const query = useQuery({
    queryKey: ['creator', 'kyc-profile'],
    queryFn: async (): Promise<KycProfile | null> => {
      try {
        const res = await kycApi.getMyKycProfile();
        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // 404 specifically indicates the creator has no KYC profile submitted yet
          return null;
        }
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Do not retry on 404
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const profile = query.data ?? null;

  let status: KycGateStatus = 'NO_PROFILE';
  if (query.isError) {
    status = 'ERROR';
  } else if (!profile) {
    status = 'NO_PROFILE';
  } else if (profile.status === 'APPROVED') {
    status = 'APPROVED';
  } else if (profile.status === 'PENDING') {
    status = 'PENDING';
  } else if (profile.status === 'REJECTED') {
    status = 'REJECTED';
  } else if (profile.status === 'DRAFT') {
    status = 'DRAFT';
  } else {
    status = profile.status as KycGateStatus;
  }

  const errorMessage = query.error
    ? axios.isAxiosError(query.error)
      ? query.error.response?.data?.message || 'Không thể kiểm tra trạng thái KYC'
      : (query.error as Error).message || 'Lỗi kết nối máy chủ'
    : undefined;

  return {
    profile,
    status,
    isApproved: status === 'APPROVED',
    isPending: status === 'PENDING',
    isRejected: status === 'REJECTED',
    hasNoProfile: status === 'NO_PROFILE' || status === 'DRAFT',
    rejectionReason: profile?.rejectionReason,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage,
    refetch: query.refetch,
  };
};
