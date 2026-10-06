export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  errorCode?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  items: T[];
  content?: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasNext?: boolean;
}

export interface ApiError {
  errorCode: string;
  message: string;
}
