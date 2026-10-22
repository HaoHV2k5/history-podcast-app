import type { DisputeItem, DisputeResult } from '../../types/dispute.ts';
import type { MilestoneItem } from '../../types/contract.ts';

export interface ResolutionEligibility {
  eligible: boolean;
  reason?: string;
}

export const BACKEND_DEFAULT_PLATFORM_FEE_PERCENT = 5.0;

export interface SplitFeeDiscrepancyCheck {
  hasDiscrepancy: boolean;
  contractFeePercent: number | null;
  backendDefaultFeePercent: number;
  message?: string;
  isUnsafeForSettlement: boolean;
}

/**
 * Checks whether the contract-specific platform fee differs from the backend global default fee.
 * In the un-patched backend, EscrowServiceImpl.splitMilestoneEscrow uses properties.getPlatformFeePercent() (5.0%)
 * instead of contract.platformFeePercent. If a contract has a negotiated or custom fee rate (e.g. 8% or 10%),
 * executing SPLIT resolution will cause a financial discrepancy between contract terms and backend settlement.
 */
export function checkSplitFeeDiscrepancy(
  contractFeePercent?: number | null
): SplitFeeDiscrepancyCheck {
  if (contractFeePercent == null) {
    return {
      hasDiscrepancy: false,
      contractFeePercent: null,
      backendDefaultFeePercent: BACKEND_DEFAULT_PLATFORM_FEE_PERCENT,
      isUnsafeForSettlement: false,
    };
  }

  const hasDiscrepancy = Math.abs(contractFeePercent - BACKEND_DEFAULT_PLATFORM_FEE_PERCENT) > 0.001;
  return {
    hasDiscrepancy,
    contractFeePercent,
    backendDefaultFeePercent: BACKEND_DEFAULT_PLATFORM_FEE_PERCENT,
    isUnsafeForSettlement: hasDiscrepancy,
    message: hasDiscrepancy
      ? `Cảnh báo sai lệch phí sàn: Hợp đồng quy định mức phí ${contractFeePercent}%, nhưng Backend hiện áp dụng mức mặc định ${BACKEND_DEFAULT_PLATFORM_FEE_PERCENT}%. Phân xử SPLIT tạm thời bị vô hiệu hóa để bảo vệ an toàn dòng tiền.`
      : undefined,
  };
}

export interface ResolutionFormValues {
  result?: DisputeResult | string;
  splitPercent?: number | string | null;
  resolution?: string | null;
  isSplitBlockedDueToDiscrepancy?: boolean;
  contractFeePercent?: number | null;
}

export interface SplitEstimate {
  grossAmount: number;
  freelancerPercent: number;
  creatorPercent: number;
  freelancerGross: number;
  hasKnownFee: boolean;
  platformFeePercent: number | null;
  fee: number | null;
  freelancerNet: number | null;
  creatorRefund: number;
  isBalanced: boolean;
  hasFeeDiscrepancy?: boolean;
  feeDiscrepancyWarning?: string;
}

export interface ResultPresentation {
  label: string;
  description: string;
  variant: 'success' | 'pending' | 'accent' | 'default' | 'outline';
}

export interface StatusPresentation {
  label: string;
  variant: 'error' | 'success' | 'outline';
}

/**
 * Checks whether an Admin can resolve a dispute based on actual backend conditions.
 */
export function isDisputeEligibleForResolution(
  dispute?: DisputeItem | null,
  milestone?: MilestoneItem | null
): ResolutionEligibility {
  if (!dispute) {
    return {
      eligible: false,
      reason: 'Không có dữ liệu khiếu nại',
    };
  }

  const normalizedStatus = (dispute.status || '').toUpperCase();

  if (normalizedStatus !== 'OPEN') {
    return {
      eligible: false,
      reason: 'Tranh chấp này đã được phân xử hoặc đã đóng',
    };
  }

  if (milestone) {
    const escrowStatus = (milestone.escrowStatus || '').toUpperCase();
    if (escrowStatus !== 'FROZEN' && escrowStatus !== 'HELD') {
      return {
        eligible: false,
        reason: `Khoản ký quỹ milestone không ở trạng thái FROZEN hoặc HELD (hiện tại: ${escrowStatus || 'Chưa xác định'})`,
      };
    }
  }

  return { eligible: true };
}

/**
 * Validates the resolution form inputs before moving to the confirmation step.
 * Aligns strictly with backend ResolveDisputeRequest and EscrowServiceImpl rules.
 */
export function validateResolutionForm(values: ResolutionFormValues): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // 1. Result must be selected
  if (!values.result) {
    errors.result = 'Vui lòng chọn kết quả phân xử';
  } else if (
    !['RELEASE_TO_FREELANCER', 'REFUND_TO_CREATOR', 'SPLIT'].includes(values.result)
  ) {
    errors.result = 'Hình thức phân xử không hợp lệ';
  }

  // 2. Resolution note is mandatory for audit trail
  const trimmedResolution = (values.resolution || '').trim();
  if (!trimmedResolution) {
    errors.resolution = 'Vui lòng nhập lý do / căn cứ phân xử của Ban Quản trị';
  }

  // 3. If SPLIT, validate percentage and safety guards
  if (values.result === 'SPLIT') {
    if (values.isSplitBlockedDueToDiscrepancy) {
      errors.splitPercent = `Hình thức SPLIT tạm thời bị khóa do sai lệch tỷ lệ phí sàn giữa Hợp đồng (${values.contractFeePercent ?? 'tùy chỉnh'}%) và Backend (5.0%). Vui lòng chọn RELEASE_TO_FREELANCER hoặc REFUND_TO_CREATOR.`;
    } else if (values.splitPercent === undefined || values.splitPercent === null || values.splitPercent === '') {
      errors.splitPercent = 'Vui lòng nhập tỷ lệ phần trăm phân chia cho Thuyết minh viên';
    } else {
      const num = Number(values.splitPercent);
      if (isNaN(num)) {
        errors.splitPercent = 'Tỷ lệ phần trăm phải là một số hợp lệ';
      } else if (num < 0 || num > 100) {
        errors.splitPercent = 'Tỷ lệ phân chia cho Thuyết minh viên phải từ 0% đến 100%';
      } else {
        // Decimal precision check: at most 2 decimal places matching backend BigDecimal scale 2
        const parts = values.splitPercent.toString().split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          errors.splitPercent = 'Tỷ lệ phần trăm hỗ trợ tối đa 2 chữ số thập phân';
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates client-side settlement estimate for SPLIT resolution.
 * If the platform fee percent cannot be reliably determined, returns hasKnownFee: false
 * with null fee and freelancerNet to avoid presenting a misleading monetary estimate.
 * Note: Purely for UX guidance preview; backend EscrowServiceImpl remains authoritative.
 */
export function calculateSplitEstimate(
  grossAmount: number,
  freelancerPercent: number,
  platformFeePercent?: number | null
): SplitEstimate {
  const safeGross = Math.max(0, Number(grossAmount) || 0);
  const safePercent = Math.min(100, Math.max(0, Number(freelancerPercent) || 0));

  // Freelancer Gross = totalAmount * (freelancerPercent / 100)
  const freelancerGross = Math.round((safeGross * safePercent) / 100);

  // Creator Refund = totalAmount - freelancerGross
  const creatorRefund = Math.max(0, safeGross - freelancerGross);
  const creatorPercent = 100 - safePercent;

  const hasKnownFee =
    typeof platformFeePercent === 'number' &&
    !isNaN(platformFeePercent) &&
    platformFeePercent >= 0;

  if (hasKnownFee) {
    const feeRate = platformFeePercent as number;
    const discrepancyCheck = checkSplitFeeDiscrepancy(feeRate);

    // Platform Fee = freelancerGross * (platformFeePercent / 100)
    const fee = Math.round((freelancerGross * feeRate) / 100);
    // Freelancer Net = freelancerGross - fee
    const freelancerNet = Math.max(0, freelancerGross - fee);
    const isBalanced = freelancerNet + fee + creatorRefund === safeGross;

    return {
      grossAmount: safeGross,
      freelancerPercent: safePercent,
      creatorPercent,
      freelancerGross,
      hasKnownFee: true,
      platformFeePercent: feeRate,
      fee,
      freelancerNet,
      creatorRefund,
      isBalanced,
      hasFeeDiscrepancy: discrepancyCheck.hasDiscrepancy,
      feeDiscrepancyWarning: discrepancyCheck.message,
    };
  }

  // If fee cannot be reliably determined, do not fabricate net estimate
  const isBalanced = freelancerGross + creatorRefund === safeGross;

  return {
    grossAmount: safeGross,
    freelancerPercent: safePercent,
    creatorPercent,
    freelancerGross,
    hasKnownFee: false,
    platformFeePercent: null,
    fee: null,
    freelancerNet: null,
    creatorRefund,
    isBalanced,
    hasFeeDiscrepancy: false,
  };
}

/**
 * Maps DisputeResult enum to Vietnamese presentation label and badge variant.
 */
export function formatDisputeResult(result?: string | null): ResultPresentation {
  if (!result) {
    return {
      label: 'Chưa có kết quả',
      description: 'Tranh chấp chưa được giải quyết',
      variant: 'outline',
    };
  }

  const normalized = result.toUpperCase();

  switch (normalized) {
    case 'RELEASE_TO_FREELANCER':
      return {
        label: 'Giải ngân cho Thuyết minh viên',
        description: 'Giải ngân 100% tiền bảo chứng (sau khấu trừ phí sàn theo hợp đồng) cho Thuyết minh viên',
        variant: 'success',
      };
    case 'REFUND_TO_CREATOR':
      return {
        label: 'Hoàn tiền cho Nhà sáng tạo',
        description: 'Hoàn trả 100% tiền bảo chứng vào ví Nhà sáng tạo, hợp đồng bị hủy',
        variant: 'pending',
      };
    case 'SPLIT':
      return {
        label: 'Phân chia tiền ký quỹ',
        description: 'Phân chia tiền bảo chứng theo tỷ lệ thỏa thuận giữa hai bên',
        variant: 'accent',
      };
    default:
      return {
        label: result,
        description: `Kết quả: ${result}`,
        variant: 'outline',
      };
  }
}

/**
 * Maps DisputeStatus enum to Vietnamese presentation label and badge variant.
 */
export function formatDisputeStatus(status?: string | null): StatusPresentation {
  if (!status) {
    return {
      label: 'Chưa xác định',
      variant: 'outline',
    };
  }

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'OPEN':
      return {
        label: 'Đang tranh chấp (Chờ phân xử)',
        variant: 'error',
      };
    case 'RESOLVED':
      return {
        label: 'Đã phân xử',
        variant: 'success',
      };
    default:
      return {
        label: status,
        variant: 'outline',
      };
  }
}
