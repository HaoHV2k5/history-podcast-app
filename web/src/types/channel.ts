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

export type ChannelResponse = ChannelItem;

export interface CreateChannelRequest {
  name: string;
  description: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

