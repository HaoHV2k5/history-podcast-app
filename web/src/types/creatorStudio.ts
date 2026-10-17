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
  elements: StoryboardElement[];
}

export interface StoryboardResponse {
  title: string;
  thumbnail_prompt?: string;
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
