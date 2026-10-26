export type ContentStatus =
  | 'DRAFT'
  | 'COMPLETED'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'FAILED'
  | string;

export type AiShieldTier = 'RED_ALERT' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'GREEN' | 'YELLOW' | 'RED' | string;

export interface CreatorUpdateVideoPayload {
  title: string;
  description?: string;
  isExclusive?: boolean;
}

export interface CreatorVideoVisibilityPayload {
  hidden: boolean;
}

export interface CreatorVideoItem {
  contentId: number;
  artifactId?: number | null;
  channelId?: number | null;
  channelName?: string | null;
  title: string;
  description?: string | null;
  status: ContentStatus;
  version?: number | null;
  fileUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  isExclusive?: boolean | null;
  createdAt: string;
  updatedAt?: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  aiShieldScore?: number | null;
  aiShieldTier?: AiShieldTier | null;
  aiShieldTierLabel?: string | null;
  aiShieldReason?: string | null;
  moderationDecision?: string | null;
  moderationReason?: string | null;
}

export interface CreatorCommentItem {
  id: number;
  userId?: number | null;
  userEmail?: string;
  textBody: string;
  status: string;
  createdAt: string;
}

export interface CreatorVideoDetail extends CreatorVideoItem {
  comments?: CreatorCommentItem[];
}

export interface CreatorVideosQueryParams {
  keyword?: string;
  status?: string;
  isExclusive?: boolean;
  sortBy?: 'createdAt' | 'title' | 'likeCount' | 'dislikeCount' | 'commentCount' | 'durationSeconds' | string;
  sortDir?: 'asc' | 'desc';
}
