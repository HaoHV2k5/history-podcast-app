export interface MilestoneDeliverableItem {
  id: number;
  milestoneId: number;
  milestoneOrderNo?: number;
  milestoneTitle?: string;
  contractId?: number;
  contractTitle?: string;
  title?: string;
  description?: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  versionNo: number;
  uploadedById?: number;
  uploadedByFullName?: string;
  downloadUrl?: string;
  previewUrl?: string;
  createdAt: string;
}
