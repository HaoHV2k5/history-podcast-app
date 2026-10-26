/**
 * Creator Studio & Whiteboard AI Types
 * PRM232 - Sử Ký History Podcast Platform
 */

export interface CreatorAiSetting {
  id?: number;
  userId?: number;
  geminiApiKey?: string;
  elevenlabsApiKey?: string;
  ttsEngine?: string; // 'edge-tts' | 'elevenlabs'
  voiceName?: string;
  hasGeminiKey: boolean;
  hasElevenlabsKey: boolean;
  updatedAt?: string;
}

export interface CreatorAiSettingRequest {
  geminiApiKey?: string;
  elevenlabsApiKey?: string;
  ttsEngine?: string;
  voiceName?: string;
}

export interface CreatorVoiceItem {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral' | 'custom' | string;
  engine: 'edge-tts' | 'elevenlabs' | string;
  accent: string;
  recommendedFor: string;
  vietnameseRating: number;
  previewUrl: string;
  sampleText: string;
  tags: string[];
  recommended?: boolean;
  cloned?: boolean;
}

export interface CreatorVoicePreviewRequest {
  engine: string;
  voiceId: string;
  text?: string;
  elevenlabsApiKey?: string;
}

export interface CreatorVoicePreviewResponse {
  success: boolean;
  url: string;
  filename: string;
}

export interface CreatorStoryboardRequest {
  topic: string;
  durationSec?: number;
  geminiApiKey?: string;
}

export interface StoryboardElement {
  label: string;
  narrativeRole?: string;
  subtitle: string;
  visual_desc?: string;
}

export interface StoryboardScene {
  scene_index: number;
  scene_title: string;
  image_prompt?: string;
  narration_text?: string;
  estimated_duration_sec?: number;
  elements: StoryboardElement[];
}

export interface StoryboardResponse {
  title: string;
  thumbnail_prompt?: string;
  estimated_duration_sec?: number;
  scenes: StoryboardScene[];
  citations?: Array<{
    id: number;
    book_title: string;
    page: number;
    similarity?: number;
    text: string;
    file_name?: string;
  }>;
}

export interface VerifyScriptRequest {
  script: string;
}

export interface HistoricalClaim {
  claim_text: string;
  verdict: 'verified' | 'error' | 'unverified' | string;
  explanation: string;
  source_reference?: string;
  suggested_fix?: string;
}

export interface ScriptVerificationResponse {
  in_scope: boolean;
  overall_score: number;
  status: 'verified' | 'needs_revision' | 'critical_errors' | string;
  summary: string;
  thumbnail_prompt?: string;
  claims: HistoricalClaim[];
  revised_script?: string;
}

export interface CreatorRenderRequest {
  title: string;
  durationSec?: number;
  renderMode?: 'whiteboard' | 'audio_podcast' | string;
  scriptText?: string;
  storyboard?: Record<string, unknown>;
  sceneImages?: Record<string, string>;
  coverImage?: string;
  thumbnailUrl?: string;
  ttsEngine?: string;
  voiceName?: string;
  channelId?: number;
  seriesId?: number;
}

export interface CreatorRenderResponse {
  jobId: string;
  contentId: number;
  artifactId: number;
  channelId: number;
  status: string;
  message?: string;
}

export interface CreatorJobStatusResponse {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'polling_error' | 'unknown' | string;
  render_mode?: string;
  step?: number;
  total_steps?: number;
  step_name?: string;
  logs?: string[];
  title?: string;
  video_url?: string;
  audio_url?: string;
  srt_url?: string;
  cloudinary_url?: string;
  error?: string;
  message?: string;
}

export interface CreatorUploadImageResponse {
  imageUrl: string;
  status: string;
  message: string;
}

export interface CreatorPodcastSentenceItem {
  index: number;
  text: string;
  audioUrl?: string | null;
  duration?: number | null;
}

export interface CreatorPodcastSentencesResponse {
  jobId?: string;
  topic?: string;
  ttsEngine?: string;
  voiceName?: string;
  sentences: CreatorPodcastSentenceItem[];
}

export interface CreatorSentencePatchItem {
  index: number;
  text: string;
  reRecord?: boolean;
}

export interface CreatorPatchPodcastRequest {
  patches?: CreatorSentencePatchItem[];
  sentences?: string[];
  coverImage?: string;
}

export interface CreatorPatchPodcastResponse {
  contentId: number;
  artifactId: number;
  version: number;
  jobId: string;
  status: string;
  fileUrl?: string;
  coverUrl?: string;
  durationSeconds?: number;
  modifiedCount?: number;
  reRecordedCount?: number;
  totalSentences?: number;
  message?: string;
}

