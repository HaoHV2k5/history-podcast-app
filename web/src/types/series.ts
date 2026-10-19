export interface SeriesItem {
  id: number;
  channelId: number;
  channelName?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT' | string;
  itemCount: number;
  totalDurationSeconds: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SeriesItemDetail {
  id: number;
  seriesId: number;
  contentId: number;
  orderNo: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  durationSeconds?: number;
  isExclusive?: boolean;
  status?: string;
  createdAt?: string;
}

export interface SeriesDetail extends SeriesItem {
  channelAvatarUrl?: string;
  items: SeriesItemDetail[];
}

export interface CreateSeriesRequest {
  title: string;
  description?: string;
  coverUrl?: string;
  status?: string;
  contentIds?: number[];
}

export interface UpdateSeriesRequest {
  title: string;
  description?: string;
  coverUrl?: string;
  status?: string;
}

export interface AddSeriesItemRequest {
  contentId: number;
  orderNo?: number;
}

export interface ReorderSeriesItemsRequest {
  contentIds: number[];
}
