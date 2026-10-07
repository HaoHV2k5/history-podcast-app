export type AiShieldTier = 'RED_ALERT' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface AdminModerationItem {
  reviewId: number;
  artifactId: number;
  contentId: number;
  channelId: number;
  channelName: string;
  creatorEmail: string;
  title: string;
  description?: string;
  fileUrl?: string;
  optimizedUrl?: string;
  durationSeconds?: number;
  contentStatus: string; // PENDING_REVIEW, PUBLISHED, REJECTED
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  adminReason?: string;
  moderatorEmail?: string;
  reviewedAt?: string;
  createdAt: string;

  // AI Shield Qualitative Evaluation
  aiShieldTier?: AiShieldTier;
  aiShieldTierLabel?: string;
  aiShieldReason?: string;
  markdownContent?: string;
}

export interface AdminModerationDecisionPayload {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
}

export interface AiShieldPolicyConfig {
  id?: number;
  tier: AiShieldTier;
  label: string;
  thresholdScore: number;
  action: string;
  description: string;
  updatedAt?: string;
}
