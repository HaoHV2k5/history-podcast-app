export interface BookingEscrowPolicy {
  contractAcceptHours: number;
  fundHours: number;
  fundPauseMaxDays: number;
  reviewDays: number;
  releaseHoldDays: number;
  revisionDays: number;
  maxMilestones: number;
  maxRevisionsDefault: number;
  platformFeePercent: number;
  membershipFeePercent: number;
  membershipDurationDays: number;
  withdrawalSlaDays: number;
  withdrawalMinAmount: number;
  depositMinAmount: number;
  jobIntervalMinutes?: number;
  termsTemplate?: string;
  renderedTerms?: string;
  updatedAt?: string;
  updatedByUserId?: number;
  updatedByUserName?: string;
}

export interface BookingEscrowConfigRequest {
  contractAcceptHours?: number;
  fundHours?: number;
  fundPauseMaxDays?: number;
  reviewDays?: number;
  releaseHoldDays?: number;
  revisionDays?: number;
  maxMilestones?: number;
  maxRevisionsDefault?: number;
  platformFeePercent?: number;
  membershipFeePercent?: number;
  membershipDurationDays?: number;
  withdrawalSlaDays?: number;
  withdrawalMinAmount?: number;
  depositMinAmount?: number;
  termsTemplate?: string;
}
