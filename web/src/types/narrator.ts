export interface NarratorProfileItem {
  id: number;
  userId: number;
  bio?: string;
  languages?: string;
  baseRate?: number;
  status: string;
  createdAt: string;
}

export interface NarratorDemoItem {
  id: number;
  narratorProfileId: number;
  title: string;
  fileUrl: string;
  uploadedAt: string;
}
