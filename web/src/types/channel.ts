export interface ChannelItem {
  id: number;
  creatorId: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}
