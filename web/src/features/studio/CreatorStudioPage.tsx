import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Settings,
  BookOpen,
  Volume2,
  Layers,
  Clapperboard,
  CheckCircle2,
  Key,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import {
  CreatorVoiceItem,
  StoryboardResponse,
  ScriptVerificationResponse,
  CreatorRenderRequest,
  CreatorJobStatusResponse,
} from '@/types/creatorStudio';
import { CreatorVideoItem } from '@/types/creatorContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  resolveMediaUrl,
  classifyInputText,
  extractNarrationFromStoryboard,
} from './creatorStudioUtils';
import { Step1ScriptInput } from './components/Step1ScriptInput';
import { Step2StoryboardScenes } from './components/Step2StoryboardScenes';
import { Step3VoiceSelector } from './components/Step3VoiceSelector';
import { Step4RenderStudio } from './components/Step4RenderStudio';
import { gsap } from 'gsap';
import { isReducedMotion, MOTION_CONFIG } from '@/utils/motion';

// Sample historical script for testing / demonstration
const SAMPLE_HISTORICAL_SCRIPT = `Mùa thu tháng 7 năm Canh Tuất 1010, vua Lý Thái Tổ khởi sự dời đô từ cố đô Hoa Lư ra thành Đại La.
Nhà vua nhận thấy đất Hoa Lư núi non hiểm trở chỉ thích hợp phòng thủ thời loạn lạc, việc hai nhà Đinh và Tiền Lê đóng mãi ở đây khiến thế đại không bền, vận số ngắn ngủi.
Để mưu nghiệp lớn cho muôn đời con cháu, nhà vua ban Chiếu dời đô, chọn Đại La vì đây là nơi trung tâm trời đất, thế đất rồng cuộn hổ ngồi, cao ráo sáng sủa, trăm họ không khổ vì ngập lụt.
Khi thuyền ngự vừa tạm đỗ dưới chân thành Đại La, có điềm lành rồng vàng hiện lên ở thuyền ngự bay vút lên trời xanh. Nhân đó, vua đổi tên Đại La thành Thăng Long, mở ra thời kỳ thái bình thịnh trị cho non sông Đại Việt.`;

export const CreatorStudioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Active Guided Step: 'script' | 'storyboard' | 'voices' | 'render'
  const [activeTab, setActiveTab] = useState<'script' | 'storyboard' | 'voices' | 'render'>('script');
  const tabContentRef = useRef<HTMLDivElement>(null);

  // GSAP Smooth Step transition feedback
  useEffect(() => {
    if (isReducedMotion() || !tabContentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: MOTION_CONFIG.distance.sm },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_CONFIG.duration.studioStep,
          ease: MOTION_CONFIG.ease,
          overwrite: 'auto',
          clearProps: 'transform,opacity',
        }
      );
    }, tabContentRef);

    return () => ctx.revert();
  }, [activeTab]);

  // Step 1: Script & Storyboard Generator State
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [storyboardDuration, setStoryboardDuration] = useState<number>(60);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<StoryboardResponse | null>(null);

  // Step 1: Historical Verification State
  const [verificationResult, setVerificationResult] = useState<ScriptVerificationResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Step 2 & 4: Image Resources State
  const [sceneImages, setSceneImages] = useState<Record<string, string>>({});
  const [uploadingSceneIndex, setUploadingSceneIndex] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Step 3: Voice Selection State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vi-VN-NamMinhNeural');
  const userSelectedVoiceRef = useRef<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Step 4: Video Rendering State
  const [renderMode, setRenderMode] = useState<'whiteboard' | 'audio_podcast'>('audio_podcast');
  const [renderTitle, setRenderTitle] = useState('');
  const [renderDurationSec, setRenderDurationSec] = useState<number>(60);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<number | null>(null);
  const [activeContentId, setActiveContentId] = useState<number | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  // Step 4: Submit Moderation State
  const [publishResult, setPublishResult] = useState<CreatorVideoItem | null>(null);
  const [publishError, setPublishError] = useState<Error | null>(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [elevenKeyInput, setElevenKeyInput] = useState('');
  const [ttsEngineInput, setTtsEngineInput] = useState('edge-tts');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Creator AI Settings
  const { data: settingsResponse } = useQuery({
    queryKey: ['creator', 'studio-settings'],
    queryFn: creatorStudioApi.getSettings,
  });
  const settings = settingsResponse?.data;

  useEffect(() => {
    if (settings) {
      setGeminiKeyInput(settings.geminiApiKey || '');
      setElevenKeyInput(settings.elevenlabsApiKey || '');
      setTtsEngineInput(settings.ttsEngine || 'edge-tts');
      if (settings.voiceName && !userSelectedVoiceRef.current) {
        setSelectedVoiceId(settings.voiceName);
      }
    }
  }, [settings]);

  // 2. Fetch Voices Catalog
  const { data: voicesResponse } = useQuery({
    queryKey: ['creator', 'studio-voices'],
    queryFn: creatorStudioApi.getVoices,
  });
  const voices: CreatorVoiceItem[] = Array.isArray(voicesResponse?.data) ? voicesResponse.data : [];

  // Update Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: { geminiApiKey?: string; elevenlabsApiKey?: string; ttsEngine?: string; voiceName?: string }) =>
      creatorStudioApi.saveSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-settings'] });
      setSettingsSuccessMsg('Đã lưu cấu hình AI thành công!');
      setTimeout(() => {
        setSettingsSuccessMsg(null);
        setIsSettingsOpen(false);
      }, 1500);
    },
  });

  // Storyboard Generation Mutation (RAG + Gemini)
  const generateStoryboardMutation = useMutation({
    mutationFn: (payload: { topic: string; durationSec: number }) =>
      creatorStudioApi.generateStoryboard({
        topic: payload.topic,
        durationSec: payload.durationSec,
        geminiApiKey: settings?.geminiApiKey || undefined,
      }),
    onSuccess: (response) => {
      const sbData = response.data as unknown as StoryboardResponse;
      setGeneratedStoryboard(sbData);
      if (sbData.title && !renderTitle) {
        setRenderTitle(sbData.title);
      }
      if (sbData.estimated_duration_sec) {
        setRenderDurationSec(sbData.estimated_duration_sec);
      }
      // If scriptContent is empty, extract narration text from storyboard scenes
      if (!scriptContent.trim() && sbData.scenes) {
        const extracted = extractNarrationFromStoryboard(sbData.scenes);
        setScriptContent(extracted);
      }
      // Advance to Step 2
      setActiveTab('storyboard');
    },
  });

  // Script Verification Mutation (Fact-checking RAG)
  const verifyScriptMutation = useMutation({
    mutationFn: (scriptText: string) => creatorStudioApi.verifyScript({ script: scriptText }),
    onSuccess: (response) => {
      setVerificationResult(response.data as unknown as ScriptVerificationResponse);
    },
  });

  // Voice Preview Mutation
  const previewVoiceMutation = useMutation({
    mutationFn: (payload: { voiceId: string; engine: string; text?: string }) =>
      creatorStudioApi.previewVoice({
        voiceId: payload.voiceId,
        engine: payload.engine,
        text: payload.text || 'Chào mừng bạn đến với Sử Ký, nơi tái hiện lịch sử Việt Nam hào hùng qua giọng đọc truyền cảm.',
      }),
    onSuccess: (res, variables) => {
      setLoadingVoiceId(null);
      const url = res.data?.url;
      if (!url) {
        setVoicePreviewError('Không nhận được tệp âm thanh nghe thử từ máy chủ.');
        return;
      }
      playAudioStream(resolveMediaUrl(url), variables.voiceId);
    },
    onError: (err: Error) => {
      setLoadingVoiceId(null);
      setVoicePreviewError(err.message || 'Không thể tạo bản nghe thử giọng đọc.');
    },
  });

  // Render Video Mutation
  const renderVideoMutation = useMutation({
    mutationFn: (payload: CreatorRenderRequest) => creatorStudioApi.renderVideo(payload),
    onSuccess: (response) => {
      setActiveJobId(response.data.jobId);
      setActiveArtifactId(response.data.artifactId);
      setActiveContentId(response.data.contentId);
      setPollingError(null);
      setPublishResult(null);
      setPublishError(null);
    },
  });

  // Submit Video for Moderation Mutation (AI Shield)
  const submitPublishMutation = useMutation({
    mutationFn: (contentId: number) => creatorStudioApi.submitVideoForPublish(contentId),
    onSuccess: (res) => {
      setPublishResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-videos'] });
    },
    onError: (err: Error) => {
      setPublishError(err);
    },
  });

  // Live Job Polling Query (every 2s while job is in progress)
  const { data: jobStatusResponse } = useQuery({
    queryKey: ['creator', 'render-job-status', activeJobId, activeArtifactId],
    queryFn: () =>
      creatorStudioApi.getJobStatus(activeJobId!, activeArtifactId || undefined),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const currentJobStatus = (query.state.data?.data as unknown as CreatorJobStatusResponse)?.status;
      if (currentJobStatus === 'completed' || currentJobStatus === 'failed') {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  const jobStatusData = (jobStatusResponse?.data as unknown as CreatorJobStatusResponse) || null;

  // Audio Playback Helpers
  const playAudioStream = (resolvedUrl: string, voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(resolvedUrl);
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);

    audio.play().catch(() => {
      setVoicePreviewError('Trình duyệt đã chặn tự động phát âm thanh. Vui lòng bấm nghe thử lại.');
      setPlayingVoiceId(null);
    });

    audio.onended = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setVoicePreviewError('Không thể phát tệp âm thanh này. Định dạng có thể chưa sẵn sàng.');
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
  };

  const handlePlayVoicePreview = (voice: CreatorVoiceItem) => {
    setVoicePreviewError(null);
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (voice.previewUrl) {
      playAudioStream(resolveMediaUrl(voice.previewUrl), voice.id);
      return;
    }

    setLoadingVoiceId(voice.id);
    previewVoiceMutation.mutate({
      voiceId: voice.id,
      engine: voice.engine,
    });
  };

  const handleSelectVoice = (voiceId: string) => {
    userSelectedVoiceRef.current = true;
    setSelectedVoiceId(voiceId);
  };

  // Upload Handlers
  const handleUploadSceneImage = async (sceneIndex: string, file: File) => {
    setUploadingSceneIndex(sceneIndex);
    try {
      const res = await creatorStudioApi.uploadSceneImage(file);
      const url = res.data?.imageUrl || '';
      if (url) {
        setSceneImages((prev) => ({ ...prev, [sceneIndex]: url }));
      }
    } finally {
      setUploadingSceneIndex(null);
    }
  };

  const handleRemoveSceneImage = (sceneIndex: string) => {
    setSceneImages((prev) => {
      const updated = { ...prev };
      delete updated[sceneIndex];
      return updated;
    });
  };

  const handleUploadCoverImage = async (file: File) => {
    setUploadingCover(true);
    try {
      const res = await creatorStudioApi.uploadSceneImage(file);
      const url = res.data?.imageUrl || '';
      if (url) {
        setCoverImageUrl(url);
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Input text classification (Branch A vs Branch B)
  const effectiveInput = scriptContent.trim() || scriptTopic.trim();
  const inputClassification = classifyInputText(effectiveInput);
  const wordCount = effectiveInput.trim() ? effectiveInput.trim().split(/\s+/).length : 0;
  const estimatedReadingSec = Math.max(5, Math.round(wordCount / 2.5));

  // Step 1: Submit to generate storyboard
  const handleStartStoryboard = () => {
    const topicToUse = scriptContent.trim() || scriptTopic.trim();
    if (!topicToUse) return;
    if (!renderTitle && scriptTopic) {
      setRenderTitle(scriptTopic);
    } else if (!renderTitle) {
      setRenderTitle(topicToUse.slice(0, 80));
    }
    generateStoryboardMutation.mutate({
      topic: topicToUse,
      durationSec: storyboardDuration,
    });
  };

  // Step 4: Submit Render Video
  const handleStartRender = () => {
    const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId);
    const finalEngine = selectedVoiceObj?.engine || settings?.ttsEngine || 'edge-tts';

    const payload: CreatorRenderRequest = {
      title: renderTitle.trim() || scriptTopic || 'Tác Phẩm Video Lịch Sử',
      durationSec: renderDurationSec || storyboardDuration || 60,
      renderMode,
      ttsEngine: finalEngine,
      voiceName: selectedVoiceId,
    };

    if (renderMode === 'audio_podcast') {
      payload.coverImage = coverImageUrl;
      payload.scriptText =
        scriptContent.trim() ||
        (generatedStoryboard?.scenes ? extractNarrationFromStoryboard(generatedStoryboard.scenes) : '');
    } else {
      payload.storyboard = generatedStoryboard as unknown as Record<string, unknown>;
      payload.sceneImages = sceneImages;
    }

    renderVideoMutation.mutate(payload);
  };

  const handleResetNewVideo = () => {
    setActiveJobId(null);
    setActiveArtifactId(null);
    setActiveContentId(null);
    setPublishResult(null);
    setPublishError(null);
    setScriptTopic('');
    setScriptContent('');
    setGeneratedStoryboard(null);
    setVerificationResult(null);
    setSceneImages({});
    setCoverImageUrl('');
    setActiveTab('script');
  };

  const selectedVoiceObj = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  // Guided Stepper Navigation Configuration
  const STEPS = [
    { id: 'script', step: 1, label: '1. Khởi Tạo Kịch Bản', icon: BookOpen, desc: 'Nhập chủ đề hoặc dán kịch bản' },
    { id: 'storyboard', step: 2, label: '2. Phân Cảnh & Ảnh Vẽ', icon: Layers, desc: 'Duyệt kịch bản, prompt & ảnh' },
    { id: 'voices', step: 3, label: '3. Giọng Đọc AI', icon: Volume2, desc: 'Lựa chọn & nghe thử giọng' },
    { id: 'render', step: 4, label: '4. Kết Xuất & Xuất Bản', icon: Clapperboard, desc: 'Render video & gửi duyệt AI Shield', hasBadge: Boolean(activeJobId) },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Studio Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-canvas font-bold shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">
              Creator Studio — Xưởng Sáng Tạo Lịch Sử
            </h1>
          </div>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Quy trình tạo Video Hoạt Họa Bảng Trắng (Whiteboard) và Audio Podcast sử học tích hợp RAG &amp; AI Shield.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="gap-2 text-xs border-border hover:bg-surface-subtle"
          >
            <Settings className="h-3.5 w-3.5 text-muted" />
            <span>Cài đặt API Key</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/creator/content')}
            className="gap-2 text-xs border-border hover:bg-surface-subtle"
          >
            <ExternalLink className="h-3.5 w-3.5 text-accent" />
            <span>Thư viện nội dung</span>
          </Button>
        </div>
      </div>

      {/* 2. Notice Banner: Missing Gemini API Key */}
      {settings && !settings.geminiApiKey && (
        <div className="rounded-xl border border-status-warning-text/30 bg-status-warning-bg/40 p-4 text-xs text-ink flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-status-warning-text shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Bạn chưa thiết lập Google Gemini API Key cá nhân. Hãy thêm API Key để tự động viết kịch bản sử liệu qua RAG và sinh phân cảnh.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs shrink-0 bg-accent text-canvas hover:bg-accent/90"
          >
            <Key className="h-3 w-3 mr-1" />
            <span>Nhập API Key ngay</span>
          </Button>
        </div>
      )}

      {/* 3. Guided Stepper Header */}
      <div className="p-1.5 rounded-xl border border-border bg-surface shadow-xs overflow-x-auto scrollbar-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 min-w-[600px]">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;
            const isCompletedStep =
              (step.id === 'script' && Boolean(generatedStoryboard || scriptContent)) ||
              (step.id === 'storyboard' && Boolean(generatedStoryboard)) ||
              (step.id === 'voices' && Boolean(selectedVoiceId)) ||
              (step.id === 'render' && Boolean(activeJobId));

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveTab(step.id as 'script' | 'storyboard' | 'voices' | 'render')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'border-accent bg-accent-soft/40 shadow-xs ring-1 ring-accent'
                    : 'border-border/60 bg-surface hover:border-accent/40 hover:bg-surface-subtle/50'
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-accent text-canvas shadow-xs'
                      : isCompletedStep
                      ? 'bg-status-success-bg text-status-success-text border border-status-success-text/30'
                      : 'bg-surface-subtle text-muted border border-border'
                  }`}
                >
                  {isCompletedStep && !isActive ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`} />
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-accent' : 'text-ink'}`}>
                      {step.label}
                    </span>
                    {step.hasBadge && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted block truncate">{step.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Step Content with GSAP Transition */}
      <div ref={tabContentRef} className="w-full">
        {/* Step 1: Script Input & RAG Fact-checking */}
        {activeTab === 'script' && (
          <Step1ScriptInput
            scriptTopic={scriptTopic}
            setScriptTopic={setScriptTopic}
            scriptContent={scriptContent}
            setScriptContent={setScriptContent}
            storyboardDuration={storyboardDuration}
            setStoryboardDuration={setStoryboardDuration}
            inputClassification={inputClassification}
            wordCount={wordCount}
            estimatedReadingSec={estimatedReadingSec}
            sampleScript={SAMPLE_HISTORICAL_SCRIPT}
            onGenerateStoryboard={handleStartStoryboard}
            isGeneratingStoryboard={generateStoryboardMutation.isPending}
            generateStoryboardError={generateStoryboardMutation.error}
            onVerifyScript={() => verifyScriptMutation.mutate(scriptContent || scriptTopic)}
            isVerifyingScript={verifyScriptMutation.isPending}
            verifyScriptError={verifyScriptMutation.error}
            verificationResult={verificationResult}
            onApplyRevisedScript={(revised) => setScriptContent(revised)}
            copiedKey={copiedKey}
            onCopy={handleCopy}
          />
        )}

        {/* Step 2: Storyboard Review, Prompt & Scene Image Upload */}
        {activeTab === 'storyboard' && (
          <Step2StoryboardScenes
            storyboard={generatedStoryboard}
            scriptContent={scriptContent}
            setScriptContent={setScriptContent}
            sceneImages={sceneImages}
            onUploadSceneImage={handleUploadSceneImage}
            onRemoveSceneImage={handleRemoveSceneImage}
            uploadingSceneIndex={uploadingSceneIndex}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onPrevStep={() => setActiveTab('script')}
            onNextStep={() => setActiveTab('voices')}
            onUpdateSceneNarration={(sceneIndex, newNarration) => {
              if (!generatedStoryboard) return;
              const updatedScenes = generatedStoryboard.scenes.map((s) =>
                s.scene_index === sceneIndex ? { ...s, narration_text: newNarration } : s
              );
              setGeneratedStoryboard({ ...generatedStoryboard, scenes: updatedScenes });
            }}
          />
        )}

        {/* Step 3: Voice Selector & Live Sample Audio Preview */}
        {activeTab === 'voices' && (
          <Step3VoiceSelector
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            onSelectVoice={handleSelectVoice}
            playingVoiceId={playingVoiceId}
            onPlayPreview={handlePlayVoicePreview}
            isLoadingVoiceId={loadingVoiceId}
            voicePreviewError={voicePreviewError}
            onPrevStep={() => setActiveTab('storyboard')}
            onNextStep={() => setActiveTab('render')}
          />
        )}

        {/* Step 4: Video Render Studio, 6-Step Monitoring & Submit Moderation */}
        {activeTab === 'render' && (
          <Step4RenderStudio
            renderMode={renderMode}
            setRenderMode={setRenderMode}
            renderTitle={renderTitle || scriptTopic || 'Tác Phẩm Lịch Sử Mới'}
            setRenderTitle={setRenderTitle}
            renderDurationSec={renderDurationSec || storyboardDuration || 60}
            selectedVoice={selectedVoiceObj}
            storyboard={generatedStoryboard}
            sceneImages={sceneImages}
            coverImageUrl={coverImageUrl}
            setCoverImageUrl={setCoverImageUrl}
            uploadingCover={uploadingCover}
            onUploadCoverImage={handleUploadCoverImage}
            onStartRender={handleStartRender}
            isStartingRender={renderVideoMutation.isPending}
            renderError={renderVideoMutation.error}
            activeJobId={activeJobId}
            jobStatus={jobStatusData}
            pollingError={pollingError}
            activeContentId={activeContentId}
            onSubmitPublish={() => {
              if (activeContentId) {
                submitPublishMutation.mutate(activeContentId);
              }
            }}
            isSubmittingPublish={submitPublishMutation.isPending}
            publishResult={publishResult}
            publishError={publishError}
            onPrevStep={() => setActiveTab('voices')}
            onResetNewVideo={handleResetNewVideo}
            onGoToContentLibrary={() => navigate('/creator/content')}
          />
        )}
      </div>

      {/* 5. Settings Modal (Gemini API Key & ElevenLabs Key) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="font-serif text-base font-bold text-ink flex items-center gap-2">
              <Settings className="h-4 w-4 text-accent" />
              <span>Cấu Hình API Key Sáng Tạo</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted">
              Cấu hình khóa API Google Gemini cá nhân để sử dụng tính năng tra cứu RAG sử liệu và sinh phân cảnh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {settingsSuccessMsg && (
              <div className="p-3 rounded-lg bg-status-success-bg/30 text-status-success-text border border-status-success-text/30 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}

            {/* Gemini Key */}
            <div className="space-y-1.5">
              <label className="font-semibold text-ink flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent text-[11px] hover:underline flex items-center gap-1"
                >
                  <span>Lấy key miễn phí</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="text-xs h-9 bg-surface-subtle font-mono"
              />
              <p className="text-[10px] text-muted">
                Key được lưu trữ an toàn trong tài khoản của bạn, chỉ sử dụng để gọi RAG và tạo kịch bản.
              </p>
            </div>

            {/* ElevenLabs Key (Optional) */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <label className="font-semibold text-ink flex items-center justify-between">
                <span>ElevenLabs API Key (Tùy chọn)</span>
                <span className="text-[10px] text-muted font-normal">Dành cho giọng đọc cao cấp</span>
              </label>
              <Input
                type="password"
                placeholder="Nhập ElevenLabs Key nếu có..."
                value={elevenKeyInput}
                onChange={(e) => setElevenKeyInput(e.target.value)}
                className="text-xs h-9 bg-surface-subtle font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={updateSettingsMutation.isPending}
              onClick={() =>
                updateSettingsMutation.mutate({
                  geminiApiKey: geminiKeyInput.trim() || undefined,
                  elevenlabsApiKey: elevenKeyInput.trim() || undefined,
                  ttsEngine: ttsEngineInput,
                })
              }
              className="text-xs font-semibold px-4"
            >
              {updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
