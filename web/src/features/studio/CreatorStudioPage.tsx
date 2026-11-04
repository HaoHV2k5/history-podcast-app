import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Settings,
  CheckCircle2,
  Key,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  X,
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
import { Badge } from '@/components/ui/badge';
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
  splitNarrationIntoElements,
} from './creatorStudioUtils';
import { Step1ScriptInput } from './components/Step1ScriptInput';
import { Step2StoryboardScenes } from './components/Step2StoryboardScenes';
import { Step3VoiceSelector } from './components/Step3VoiceSelector';
import { Step4RenderStudio } from './components/Step4RenderStudio';
import type { CreationMode } from './components/StudioCreationMethodToggle';
import { StudioHeader } from './components/StudioHeader';
import { StudioWorkflowStepper } from './components/StudioWorkflowStepper';
import { StudioApiKeyOnboardingModal } from './components/StudioApiKeyOnboardingModal';
import {
  StepTransitionConfirmationDialog,
  StepTransitionModalState,
} from './components/StepTransitionConfirmationDialog';
import { gsap } from 'gsap';
import { isReducedMotion } from '@/utils/motion';

// Sample historical script for testing / demonstration
const SAMPLE_HISTORICAL_SCRIPT = `Mùa thu tháng 7 năm Canh Tuất 1010, vua Lý Thái Tổ khởi sự dời đô từ cố đô Hoa Lư ra thành Đại La.
Nhà vua nhận thấy đất Hoa Lư núi non hiểm trở chỉ thích hợp phòng thủ thời loạn lạc, việc hai nhà Đinh và Tiền Lê đóng mãi ở đây khiến thế đại không bền, vận số ngắn ngủi.
Để mưu nghiệp lớn cho muôn đời con cháu, nhà vua ban Chiếu dời đô, chọn Đại La vì đây là nơi trung tâm trời đất, thế đất rồng cuộn hổ ngồi, cao ráo sáng sủa, trăm họ không khổ vì ngập lụt.
Khi thuyền ngự vừa tạm đỗ dưới chân thành Đại La, có điềm lành rồng vàng hiện lên ở thuyền ngự bay vút lên trời xanh. Nhân đó, vua đổi tên Đại La thành Thăng Long, mở ra thời kỳ thái bình thịnh trị cho non sông Đại Việt.`;

export const CreatorStudioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMockStep4 = searchParams.get('step') === '4';

  // Active Guided Step: 'script' | 'storyboard' | 'voices' | 'render'
  const [activeTab, setActiveTab] = useState<'script' | 'storyboard' | 'voices' | 'render'>(
    isMockStep4 ? 'render' : 'script'
  );

  // Animation Refs (GSAP Smooth Float In matching Content Library)
  const isFirstMountRef = useRef<boolean>(true);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // ─── 1. ENTRANCE ANIMATION: GSAP SMOOTH CASCADE ON MOUNT ───────────────────
  useEffect(() => {
    if (isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.44 }
        );
      }

      if (bannerRef.current) {
        tl.fromTo(
          bannerRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.36 },
          '-=0.25'
        );
      }

      if (stepperRef.current) {
        tl.fromTo(
          stepperRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.25'
        );
      }

      if (tabContentRef.current) {
        tl.fromTo(
          tabContentRef.current,
          { opacity: 0, y: 18, scale: 0.99 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.42,
            clearProps: 'transform,opacity',
          },
          '-=0.2'
        );
      }
    }, pageContainerRef);

    return () => ctx.revert();
  }, []);

  // ─── 2. STEP TRANSITION: GSAP SMOOTH STEP CHANGE ───────────────────────────
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (isReducedMotion() || !tabContentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        tabContentRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'transform,opacity',
        }
      );
    }, tabContentRef);

    return () => ctx.revert();
  }, [activeTab]);

  // Step 1: Script & Storyboard Generator State
  const [creationMode, setCreationMode] = useState<CreationMode | null>(
    isMockStep4 ? 'ai_prompt' : null
  );
  const [scriptTopic, setScriptTopic] = useState(
    isMockStep4 ? 'Hội nghị Diên Hồng (năm 1284)' : ''
  );
  const [scriptContent, setScriptContent] = useState('');
  const [storyboardDuration, setStoryboardDuration] = useState<number>(60);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<StoryboardResponse | null>(() => {
    if (isMockStep4) {
      return {
        title: 'Hội nghị Diên Hồng (năm 1284)',
        scenes: [
          {
            scene_index: 1,
            scene_title: 'Sứ mệnh và tình thế năm 1284',
            estimated_duration_sec: 30,
            narration_text:
              'Mùa đông năm 1284, Thoát Hoan mượn đường đánh Chiêm Thành nhưng thực chất nhằm xâm lược Đại Việt.',
            image_prompt: 'Cảnh biên ải Lạng Sơn mây mù, quân Nguyên áp sát biên cương',
            elements: [
              { label: 'Biên Cương', subtitle: 'Mùa đông năm 1284, Thoát Hoan mượn đường đánh Chiêm Thành.' },
              { label: 'Âm Mưu', subtitle: 'Thực chất là cớ nhằm xâm lược bờ cõi Đại Việt.' },
            ],
          },
          {
            scene_index: 2,
            scene_title: 'Hội nghị Diên Hồng - Lời thề Sát Thát',
            estimated_duration_sec: 30,
            narration_text:
              'Thượng hoàng triệu tập các phụ lão tại điện Diên Hồng, muôn người đồng thanh hô Đánh.',
            image_prompt: 'Các bô lão giơ nắm đấm hô Đánh trong điện Diên Hồng',
            elements: [
              { label: 'Điện Diên Hồng', subtitle: 'Thượng hoàng triệu tập các phụ lão muôn nơi.' },
              { label: 'Quyết Chiến', subtitle: 'Muôn người như một, đồng thanh hô vang Đánh.' },
            ],
          },
        ],
      };
    }
    return null;
  });

  // Progressive Sequential Flow (Steps 1 -> 4 unlocked strictly one by one)
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(isMockStep4 ? 4 : 1);

  // Step 1: Historical Verification State
  const [verificationResult, setVerificationResult] = useState<ScriptVerificationResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Step 2 & 4: Image Resources State
  const [sceneImages, setSceneImages] = useState<Record<string, string>>(() => {
    if (isMockStep4) {
      return {
        '1': 'https://res.cloudinary.com/dummy/s1.png',
        '2': 'https://res.cloudinary.com/dummy/s2.png',
      };
    }
    return {};
  });
  const [uploadingSceneIndex, setUploadingSceneIndex] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Step 3: Voice Selection State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('vi-VN-NamMinhNeural');
  const userSelectedVoiceRef = useRef<boolean>(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Step 4: Video Rendering State
  const [renderMode, setRenderMode] = useState<'whiteboard' | 'audio_podcast' | null>(
    isMockStep4 ? 'whiteboard' : null
  );
  const [renderTitle, setRenderTitle] = useState(
    isMockStep4 ? 'Hội nghị Diên Hồng (năm 1284)' : ''
  );
  const [renderDurationSec, setRenderDurationSec] = useState<number>(60);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<number | null>(null);
  const [activeContentId, setActiveContentId] = useState<number | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [devJobStatusOverride, setDevJobStatusOverride] = useState<CreatorJobStatusResponse | null>(null);

  // Step 4: Submit Moderation State
  const [publishResult, setPublishResult] = useState<CreatorVideoItem | null>(null);
  const [publishError, setPublishError] = useState<Error | null>(null);

  // 2-Phase Execution States (Nhịp 1: Rào chắn mềm sử liệu -> Nhịp 2: Render ngầm)
  const [isSoftGuardChecking, setIsSoftGuardChecking] = useState(false);
  const [softGuardWarning, setSoftGuardWarning] = useState<ScriptVerificationResponse | null>(null);
  const [isSoftGuardModalOpen, setIsSoftGuardModalOpen] = useState(false);

  // Step Transition Pop-up State (emil-design-eng)
  const [transitionModal, setTransitionModal] = useState<StepTransitionModalState>(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [elevenKeyInput, setElevenKeyInput] = useState('');
  const [ttsEngineInput, setTtsEngineInput] = useState('edge-tts');
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // First-Time Creator AI Onboarding Modal State
  // Luôn hiển thị pop-up khi mở trang, chỉ tắt vĩnh viễn khi người dùng tick "Không hiển thị lại nữa"
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(() => {
    try {
      return localStorage.getItem('su_ky_dont_show_api_onboarding') !== 'true';
    } catch {
      return true;
    }
  });

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

  const handleCloseOnboarding = (dontShowAgain?: boolean) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('su_ky_dont_show_api_onboarding', 'true');
      } catch {
        // ignore
      }
    }
    setIsOnboardingModalOpen(false);
  };

  const handleOpenSettingsFromOnboarding = (dontShowAgain?: boolean) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('su_ky_dont_show_api_onboarding', 'true');
      } catch {
        // ignore
      }
    }
    setIsOnboardingModalOpen(false);
    setIsSettingsOpen(true);
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__creatorStudioDev = {
        setActiveTab,
        setCreationMode,
        setGeneratedStoryboard,
        setMaxUnlockedStep,
        setSceneImages,
        setRenderMode,
        setSelectedVoiceId,
        setTransitionModal,
        setCoverImageUrl,
        setRenderTitle,
        setActiveJobId,
        setActiveContentId,
        setPublishResult,
        setRenderSuccessToast,
        setDevJobStatus: setDevJobStatusOverride,
        setSoftGuardWarning,
        setIsSoftGuardModalOpen,
        setIsSoftGuardChecking,
      };
    }
  }, []);

  // 2. Fetch Voices Catalog
  const { data: voicesResponse } = useQuery({
    queryKey: ['creator', 'studio-voices'],
    queryFn: creatorStudioApi.getVoices,
  });
  const voices: CreatorVoiceItem[] = Array.isArray(voicesResponse?.data) ? voicesResponse.data : [];

  const selectedVoiceObj = useMemo(() => {
    const found = voices.find((v) => v.id === selectedVoiceId);
    if (found) return found;
    if (selectedVoiceId && !selectedVoiceId.startsWith('vi-VN-')) {
      return {
        id: selectedVoiceId,
        name: `Giọng ElevenLabs (${selectedVoiceId.length > 10 ? selectedVoiceId.slice(0, 8) + '...' : selectedVoiceId})`,
        gender: 'custom',
        engine: 'elevenlabs',
        accent: 'ElevenLabs Tùy chỉnh',
        recommendedFor: 'Voice ID ElevenLabs cá nhân từ Creator',
        vietnameseRating: 5.0,
        previewUrl: '',
        sampleText: '',
        tags: ['ElevenLabs', 'Custom Voice ID'],
      } as CreatorVoiceItem;
    }
    return undefined;
  }, [voices, selectedVoiceId]);

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
    mutationFn: (payload: { topic: string; durationSec: number; keepOriginalScript?: boolean }) =>
      creatorStudioApi.generateStoryboard({
        topic: payload.topic,
        durationSec: payload.durationSec,
        geminiApiKey: settings?.geminiApiKey || undefined,
        keepOriginalScript: payload.keepOriginalScript,
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
      // Populate scriptContent with full generated narration from Gemini AI
      if (sbData.scenes && sbData.scenes.length > 0) {
        const extracted = extractNarrationFromStoryboard(sbData.scenes);
        if (extracted && (creationMode === 'ai_prompt' || !scriptContent.trim())) {
          setScriptContent(extracted);
        }
      }
      // Unlock Step 2 and advance immediately
      setMaxUnlockedStep((prev) => Math.max(prev, 2));
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

  const jobStatusData = devJobStatusOverride || ((jobStatusResponse?.data as unknown as CreatorJobStatusResponse) || null);

  // Floating Completion Toast Notification
  const prevJobStatusRef = useRef<string | null>(null);
  const [renderSuccessToast, setRenderSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (
      jobStatusData?.status === 'completed' &&
      prevJobStatusRef.current &&
      prevJobStatusRef.current !== 'completed'
    ) {
      setRenderSuccessToast(
        'Kết xuất video hoàn tất 100%! Bạn có thể xem trước tác phẩm và gửi kiểm duyệt AI Shield.'
      );
    }
    prevJobStatusRef.current = jobStatusData?.status || null;
  }, [jobStatusData?.status]);

  useEffect(() => {
    if (!renderSuccessToast) return;
    const timer = setTimeout(() => setRenderSuccessToast(null), 7000);
    return () => clearTimeout(timer);
  }, [renderSuccessToast]);

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

  const handlePlayVoicePreview = (voice: CreatorVoiceItem, customText?: string) => {
    setVoicePreviewError(null);
    const trimmedCustom = customText?.trim();

    // If currently playing this voice AND no new custom text is requested, toggle pause
    if (playingVoiceId === voice.id && !trimmedCustom) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop current playback before starting new request
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If custom text is provided, ALWAYS invoke previewVoiceMutation to render the custom text live!
    if (trimmedCustom) {
      setLoadingVoiceId(voice.id);
      previewVoiceMutation.mutate({
        voiceId: voice.id,
        engine: voice.engine,
        text: trimmedCustom,
      });
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
    const activeFolder = 'whiteboard/scenes' as const;
    try {
      const res = await creatorStudioApi.uploadSceneImage(file, activeFolder);
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
    const activeFolder = 'podcasts/covers' as const;
    try {
      const res = await creatorStudioApi.uploadSceneImage(file, activeFolder);
      const url = res.data?.imageUrl || '';
      if (url) {
        setCoverImageUrl(url);
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleUploadThumbnail = async (file: File) => {
    setUploadingThumbnail(true);
    const activeFolder = 'whiteboard/thumbnails' as const;
    try {
      const res = await creatorStudioApi.uploadSceneImage(file, activeFolder);
      const url = res.data?.imageUrl || '';
      if (url) {
        setThumbnailUrl(url);
      }
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Input text classification (Branch A vs Branch B)
  const effectiveInput =
    creationMode === 'manual_script'
      ? (scriptContent.trim() || scriptTopic.trim())
      : (scriptTopic.trim() || scriptContent.trim());
  const inputClassification = classifyInputText(effectiveInput);
  const wordCount = effectiveInput.trim() ? effectiveInput.trim().split(/\s+/).length : 0;
  const estimatedReadingSec = Math.max(5, Math.round(wordCount / 2.5));

  // Step 1: Submit to generate storyboard
  const handleStartStoryboard = () => {
    if (creationMode === 'manual_script') {
      if (!scriptTopic.trim() || !scriptContent.trim()) return;
    } else {
      if (!scriptTopic.trim()) return;
    }

    const topicToUse =
      creationMode === 'manual_script'
        ? (scriptTopic.trim() ? `${scriptTopic.trim()}: ${scriptContent.trim()}` : scriptContent.trim())
        : (
            scriptTopic.trim() && scriptContent.trim()
              ? `${scriptTopic.trim()} - ${scriptContent.trim()}`
              : (scriptTopic.trim() || scriptContent.trim())
          );
    if (!topicToUse) return;
    if (!renderTitle && scriptTopic) {
      setRenderTitle(scriptTopic.trim());
    } else if (!renderTitle) {
      setRenderTitle(topicToUse.slice(0, 80));
    }
    generateStoryboardMutation.mutate({
      topic: topicToUse,
      durationSec: storyboardDuration,
      keepOriginalScript: creationMode === 'manual_script',
    });
  };

  // Step 4: 2-Phase Creation Flow (Nhịp 1: Rào chắn mềm sử liệu ngầm -> Nhịp 2: Render video ngầm)
  const executeRender = (scriptOverride?: string) => {
    const isCustomElevenLabs = !selectedVoiceObj && selectedVoiceId && !selectedVoiceId.startsWith('vi-VN-');
    const finalEngine = selectedVoiceObj?.engine || (isCustomElevenLabs ? 'elevenlabs' : settings?.ttsEngine || 'edge-tts');

    const storyboardNarration = generatedStoryboard?.scenes
      ? extractNarrationFromStoryboard(generatedStoryboard.scenes)
      : '';

    let finalScript = scriptOverride;
    if (finalScript === undefined) {
      if (creationMode === 'ai_prompt') {
        finalScript =
          scriptContent.trim() && scriptContent.trim().length >= storyboardNarration.length * 0.8
            ? scriptContent.trim()
            : (storyboardNarration || scriptContent.trim());
      } else {
        finalScript = scriptContent.trim() || storyboardNarration;
      }
    }

    const payload: CreatorRenderRequest = {
      title: renderTitle.trim() || scriptTopic || 'Tác Phẩm Video Lịch Sử',
      durationSec: renderDurationSec || storyboardDuration || 60,
      renderMode: renderMode || 'audio_podcast',
      ttsEngine: finalEngine,
      voiceName: selectedVoiceId || 'vi-VN-NamMinhNeural',
      thumbnailUrl: thumbnailUrl || coverImageUrl || sceneImages['1'] || '',
    };

    if (renderMode === 'audio_podcast') {
      payload.coverImage = coverImageUrl;
      payload.scriptText = finalScript;
    } else {
      payload.storyboard = generatedStoryboard as unknown as Record<string, unknown>;
      payload.sceneImages = sceneImages;
    }

    renderVideoMutation.mutate(payload);
  };

  const handleStartRender = async () => {
    const storyboardNarration = generatedStoryboard?.scenes
      ? extractNarrationFromStoryboard(generatedStoryboard.scenes)
      : '';
    const finalScript =
      creationMode === 'ai_prompt' && storyboardNarration && (!scriptContent.trim() || scriptContent.trim().length < storyboardNarration.length * 0.8)
        ? storyboardNarration
        : (scriptContent.trim() || storyboardNarration || scriptTopic.trim());

    // Nhịp 1: Rào chắn mềm kiểm tra sử liệu ngầm (1 - 2 giây)
    setIsSoftGuardChecking(true);
    try {
      const verifyRes = await creatorStudioApi.verifyScript({ script: finalScript });
      const report = verifyRes.data;

      // Nếu phát hiện có nghi vấn sử liệu (có claims 'error' hoặc điểm < 75)
      const hasErrors =
        report?.claims?.some((c) => c.verdict === 'error') ||
        (report?.overall_score !== undefined && report.overall_score < 75);

      if (hasErrors && report) {
        setSoftGuardWarning(report);
        setIsSoftGuardModalOpen(true);
        setIsSoftGuardChecking(false);
        return;
      }
    } catch (e) {
      // Nếu việc đối chiếu sử liệu ngầm gặp trục trặc mạng, tôn trọng Creator và tiếp tục
      console.warn('Soft-guard check bypassed due to network/engine exception:', e);
    } finally {
      setIsSoftGuardChecking(false);
    }

    // Nhịp 2: Kịch bản chuẩn xác, tự động chạy thẳng sang Render
    executeRender();
  };

  const handleApplySoftGuardFixAndRender = () => {
    const revised = softGuardWarning?.revised_script || '';
    if (revised) {
      setScriptContent(revised);
    }
    setIsSoftGuardModalOpen(false);
    executeRender(revised || undefined);
  };

  const handleBypassSoftGuardAndRender = () => {
    setIsSoftGuardModalOpen(false);
    executeRender();
  };

  const handleResetNewVideo = () => {
    setActiveJobId(null);
    setActiveArtifactId(null);
    setActiveContentId(null);
    setPublishResult(null);
    setPublishError(null);
    setScriptTopic('');
    setScriptContent('');
    setCreationMode('ai_prompt');
    setGeneratedStoryboard(null);
    setVerificationResult(null);
    setSceneImages({});
    setCoverImageUrl('');
    setThumbnailUrl('');
    setUploadingThumbnail(false);
    setMaxUnlockedStep(1);
    setActiveTab('script');
  };

  const effectiveMaxStep = Math.max(maxUnlockedStep, generatedStoryboard ? 2 : 1);

  // Guarded transition from Step 2 to Step 3
  const handleNextFromStoryboard = (explicitTargetTab?: 'voices' | 'render') => {
    const targetTab = explicitTargetTab || 'voices';
    const isAudioPodcast = renderMode === 'audio_podcast';
    const isPendingCover = isAudioPodcast && !coverImageUrl.trim();
    const totalScenes = generatedStoryboard?.scenes?.length || 0;
    const uploadedCount =
      generatedStoryboard?.scenes?.filter((s) => Boolean(sceneImages[String(s.scene_index)]))
        .length || 0;
    const isPendingScenes = !isAudioPodcast && (totalScenes === 0 || uploadedCount < totalScenes);

    if (isPendingCover) {
      setTransitionModal({
        type: 'step2_missing_cover',
        title: 'Bắt Buộc Tải Ảnh Bìa Podcast',
        description:
          'Định dạng Audio Podcast bắt buộc phải có ảnh bìa chính (tỷ lệ 1:1) đại diện cho tác phẩm trước khi bạn có thể chọn giọng đọc và chuyển sang các bước tiếp theo.',
        targetTab: 'storyboard',
      });
      return;
    }

    if (isPendingScenes) {
      setTransitionModal({
        type: 'step2_missing_scenes',
        title: 'Bắt Buộc Tải Đủ Toàn Bộ Ảnh Phân Cảnh',
        description: `Bạn mới tải lên ${uploadedCount}/${totalScenes} ảnh phân cảnh. Video Hoạt Họa Bảng Trắng bắt buộc bạn phải tải lên đầy đủ hình ảnh cho toàn bộ ${totalScenes} phân cảnh trước khi được chuyển sang Bước 3 (Chọn giọng đọc).`,
        uploadedCount,
        totalScenes,
        targetTab: 'storyboard',
      });
      return;
    }

    // All clear -> unlock & advance
    setMaxUnlockedStep((prev) => Math.max(prev, targetTab === 'render' ? 4 : 3));
    setActiveTab(targetTab);
  };

  // Guarded transition from Step 3 to Step 4
  const handleNextFromVoices = () => {
    if (!selectedVoiceId.trim()) {
      setTransitionModal({
        type: 'step3_unselected_voice',
        title: 'Chưa Chọn Giọng Đọc Thuyết Minh Riêng',
        description:
          'Bạn chưa chọn giọng đọc riêng trong danh sách 19 giọng đọc lịch sử. Nếu tiếp tục, hệ thống sẽ tự động sử dụng giọng đọc chuẩn mặc định: Nam Minh (Giọng Nam Miền Bắc, Edge-TTS, hào sảng). Bạn có muốn tiếp tục không?',
        targetTab: 'render',
      });
      return;
    }

    setMaxUnlockedStep((prev) => Math.max(prev, 4));
    setActiveTab('render');
  };

  // Guarded transition when clicking on the Stepper tabs
  const handleSelectTab = (targetTab: 'script' | 'storyboard' | 'voices' | 'render') => {
    if (targetTab === activeTab) return;

    if (activeTab === 'storyboard' && (targetTab === 'voices' || targetTab === 'render')) {
      handleNextFromStoryboard(targetTab);
      return;
    }

    if (activeTab === 'voices' && targetTab === 'render') {
      handleNextFromVoices();
      return;
    }

    setActiveTab(targetTab);
  };

  // When clicking on a locked step in the stepper
  const handleAttemptLockedStep = (targetTab: 'script' | 'storyboard' | 'voices' | 'render') => {
    if (!generatedStoryboard) {
      const hasInput = Boolean(scriptTopic.trim() || scriptContent.trim());
      if (!hasInput) {
        setTransitionModal({
          type: 'step1_empty_input',
          title: 'Chưa Nhập Kịch Bản Lịch Sử (Bắt Buộc)',
          description:
            'Bạn chưa nhập chủ đề hoặc kịch bản lịch sử ở Bước 1. Đây là bước bắt buộc để AI có thể tra cứu sử liệu chính thống và lập phân cảnh trước khi mở khóa các bước tiếp theo.',
        });
      } else {
        setTransitionModal({
          type: 'step1_not_generated',
          title: 'Chưa Khởi Tạo Phân Cảnh Kịch Bản (Bắt Buộc)',
          description:
            'Bạn đã nhập chủ đề nhưng chưa tạo phân cảnh. Vui lòng bấm nút "Tạo kịch bản với AI" ở cuối trang Bước 1 để tạo phân cảnh trước khi chuyển bước.',
        });
      }
      return;
    }

    if (targetTab === 'voices') {
      handleNextFromStoryboard('voices');
    } else if (targetTab === 'render') {
      if (activeTab === 'voices') {
        handleNextFromVoices();
      } else {
        handleNextFromStoryboard('render');
      }
    }
  };

  // Confirm continue from pop-up dialog
  const handleConfirmTransition = () => {
    if (!transitionModal) return;

    if (
      transitionModal.type === 'step2_missing_cover' ||
      transitionModal.type === 'step2_missing_scenes'
    ) {
      const target = transitionModal.targetTab;
      if (target && target !== 'storyboard') {
        setMaxUnlockedStep((prev) => Math.max(prev, target === 'render' ? 4 : 3));
        setActiveTab(target);
      }
    } else if (transitionModal.type === 'step3_unselected_voice') {
      setMaxUnlockedStep((prev) => Math.max(prev, 4));
      setActiveTab('render');
    }

    setTransitionModal(null);
  };

  return (
    <div ref={pageContainerRef} className="space-y-4 pb-10">
      {/* Floating Success Toast on Video Completion */}
      {renderSuccessToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 right-6 z-50 flex items-center justify-between gap-3 rounded-xl border border-status-success-text/40 bg-surface px-4 py-3 text-xs font-semibold text-ink shadow-lg animate-in slide-in-from-top-4 duration-200 select-none max-w-md border-l-4 border-l-status-success-text"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-status-success-bg text-status-success-text">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="leading-snug">{renderSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setRenderSuccessToast(null)}
            className="p-1 text-muted hover:text-ink transition-colors cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Page Header & Studio Actions with Historical Watermark */}
      <div ref={headerRef}>
        <StudioHeader
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNavigateLibrary={() => navigate('/creator/content')}
        />
      </div>

      {/* 2. Notice Banner: Missing Gemini API Key */}
      {settings && !settings.geminiApiKey && (
        <div ref={bannerRef} className="rounded-xl border border-status-warning-text/30 bg-status-warning-bg/40 px-3.5 py-2.5 text-xs text-ink flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-status-warning-text shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Bạn chưa thiết lập Google Gemini API Key cá nhân. Hãy thêm API Key để tự động viết kịch bản sử liệu qua RAG và sinh phân cảnh.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOnboardingModalOpen(true)}
              className="text-xs h-7 px-2.5 bg-white border-amber-300/80 text-amber-900 hover:bg-amber-50 cursor-pointer"
            >
              <span>Xem hướng dẫn lấy Key</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs bg-accent text-canvas hover:bg-accent/90 h-7 px-2.5 cursor-pointer"
            >
              <Key className="h-3 w-3 mr-1" />
              <span>Nhập API Key ngay</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. Four-Stage Workflow Indicator (Stepper) */}
      <div ref={stepperRef}>
        <StudioWorkflowStepper
          activeTab={activeTab}
          maxUnlockedStep={effectiveMaxStep}
          hasStoryboard={Boolean(generatedStoryboard)}
          hasActiveJob={Boolean(activeJobId)}
          onSelectTab={handleSelectTab}
          onAttemptLockedStep={handleAttemptLockedStep}
        />
      </div>

      {/* 4. Active Step Content with GSAP & Smooth Entrance Transition */}
      <div ref={tabContentRef} className="w-full">
        {/* Step 1: Script Input & RAG Fact-checking */}
        {activeTab === 'script' && (
          <Step1ScriptInput
            renderMode={renderMode}
            setRenderMode={setRenderMode}
            creationMode={creationMode}
            setCreationMode={setCreationMode}
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
            onOpenSettings={() => setIsSettingsOpen(true)}
            onClearError={() => {
              generateStoryboardMutation.reset();
              verifyScriptMutation.reset();
            }}
          />
        )}

        {/* Step 2: Storyboard Review, Prompt & Scene Image Upload */}
        {activeTab === 'storyboard' && (
          <Step2StoryboardScenes
            renderMode={renderMode || 'audio_podcast'}
            storyboard={generatedStoryboard}
            scriptContent={scriptContent}
            setScriptContent={setScriptContent}
            sceneImages={sceneImages}
            onUploadSceneImage={handleUploadSceneImage}
            onRemoveSceneImage={handleRemoveSceneImage}
            uploadingSceneIndex={uploadingSceneIndex}
            coverImageUrl={coverImageUrl}
            setCoverImageUrl={setCoverImageUrl}
            uploadingCover={uploadingCover}
            onUploadCoverImage={handleUploadCoverImage}
            thumbnailUrl={thumbnailUrl}
            setThumbnailUrl={setThumbnailUrl}
            uploadingThumbnail={uploadingThumbnail}
            onUploadThumbnail={handleUploadThumbnail}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            onPrevStep={() => setActiveTab('script')}
            onNextStep={() => handleNextFromStoryboard('voices')}
            onUpdateSceneNarration={(sceneIndex, newNarration, updatedElements) => {
              if (!generatedStoryboard) return;
              const updatedScenes = generatedStoryboard.scenes.map((s) => {
                if (s.scene_index !== sceneIndex) return s;
                let elems = updatedElements || s.elements;
                if (!updatedElements && s.elements && s.elements.length > 0) {
                  const parts = splitNarrationIntoElements(newNarration, s.elements.length);
                  elems = s.elements.map((el, i) => ({
                    ...el,
                    subtitle: parts[i] || el.subtitle || '',
                  }));
                }
                return {
                  ...s,
                  narration_text: newNarration,
                  elements: elems,
                };
              });
              setGeneratedStoryboard({ ...generatedStoryboard, scenes: updatedScenes });
              const updatedNarration = extractNarrationFromStoryboard(updatedScenes);
              if (updatedNarration) {
                setScriptContent(updatedNarration);
              }
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
            onNextStep={handleNextFromVoices}
          />
        )}

        {/* Step 4: Video Render Studio, 6-Step Monitoring & Submit Moderation */}
        {activeTab === 'render' && (
          <Step4RenderStudio
            renderMode={renderMode || 'audio_podcast'}
            setRenderMode={setRenderMode as (mode: 'whiteboard' | 'audio_podcast') => void}
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
            isStartingRender={renderVideoMutation.isPending || isSoftGuardChecking}
            isCheckingSoftGuard={isSoftGuardChecking}
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
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border-border/80 rounded-2xl shadow-apple-dialog p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-base font-bold text-ink flex items-center gap-2 tracking-tight">
              <Settings className="h-4 w-4 text-accent" />
              <span>Cấu Hình API Key Sáng Tạo</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted leading-relaxed">
              Cấu hình khóa API Google Gemini cá nhân để sử dụng tính năng tra cứu RAG sử liệu và sinh phân cảnh.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {settingsSuccessMsg && (
              <div className="p-3 rounded-xl bg-status-success-bg/40 text-status-success-text border border-status-success-text/30 flex items-center gap-2 font-medium">
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
                  className="text-accent text-[11px] hover:underline flex items-center gap-1 font-medium"
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
                className="text-xs h-9 bg-surface-subtle font-mono rounded-xl border-border/80"
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
                className="text-xs h-9 bg-surface-subtle font-mono rounded-xl border-border/80"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs h-9 px-4 rounded-xl border-border/80 hover:bg-white text-muted hover:text-ink cursor-pointer transition-[background-color,color,transform] duration-150 active:scale-[0.98]"
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
              className="text-xs h-9 font-semibold px-5 rounded-xl bg-accent text-white hover:bg-accent/90 shadow-2xs cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.98]"
            >
              {updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Soft Guard Historical Warning Dialog (Rào Chắn Mềm Sử Liệu) */}
      <Dialog open={isSoftGuardModalOpen} onOpenChange={setIsSoftGuardModalOpen}>
        <DialogContent maxWidth="max-w-2xl" className="p-6 bg-white/95 backdrop-blur-2xl border-border/80 rounded-2xl shadow-apple-dialog max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0 shadow-xs">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="font-serif text-base font-bold text-ink tracking-tight">
                  Đối Chiếu Sử Liệu RAG: Phát Hiện Nghi Vấn Lịch Sử
                </DialogTitle>
                <DialogDescription className="text-xs text-muted leading-relaxed">
                  Hệ thống đối chiếu kịch bản của bạn với kho sách sử chính thống (Đại Việt Sử Ký Toàn Thư, Khâm Định Việt Sử).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {softGuardWarning && (() => {
            const attentionClaims = (softGuardWarning.claims || []).filter(
              (c) => c.verdict === 'error' || c.verdict === 'unverified'
            );
            const verifiedClaims = (softGuardWarning.claims || []).filter(
              (c) => c.verdict === 'verified'
            );

            return (
              <div className="space-y-4 py-2 text-xs">
                {/* Score and summary pill */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 flex items-center gap-1.5">
                      <span>Điểm tin cậy sử liệu:</span>
                      <span className="text-sm font-mono">{softGuardWarning.overall_score || 70} / 100</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-surface rounded-full px-2.5">
                      Rào chắn mềm (Soft Guard)
                    </Badge>
                  </div>
                  {softGuardWarning.summary && (
                    <p className="text-muted leading-relaxed">{softGuardWarning.summary}</p>
                  )}
                </div>

                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {/* Attention Claims (Errors & Unverified) */}
                  {attentionClaims.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span>Luận điểm cần hiệu đính ({attentionClaims.length}):</span>
                      </span>
                      <div className="space-y-2">
                        {attentionClaims.map((claim, idx) => {
                          const isError = claim.verdict === 'error';
                          return (
                            <div
                              key={`attn-${idx}`}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                                isError
                                  ? 'bg-rose-500/8 border-rose-500/25'
                                  : 'bg-amber-500/8 border-amber-500/25'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-serif italic font-medium text-ink">
                                  &quot;{claim.claim_text}&quot;
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 uppercase font-bold ${
                                    isError
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  {isError ? 'Sai lệch niên đại / nhân vật' : 'Dã sử / Cần thẩm định'}
                                </span>
                              </div>
                              <p className="text-muted text-[11px] leading-relaxed">{claim.explanation}</p>
                              {claim.source_reference && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-mono">
                                  <BookOpen className="h-3 w-3 shrink-0" />
                                  <span>{claim.source_reference}</span>
                                </div>
                              )}
                              {claim.suggested_fix && (
                                <div className="p-2.5 rounded-lg bg-surface border border-accent/25 text-[11px] space-y-1">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3" />
                                    <span>Gợi ý chuẩn xác:</span>
                                  </div>
                                  <p className="font-serif italic text-ink leading-relaxed">{claim.suggested_fix}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Verified Claims */}
                  {verifiedClaims.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="font-semibold text-emerald-800 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Luận điểm đã chuẩn xác chính sử ({verifiedClaims.length}):</span>
                      </span>
                      <div className="space-y-2">
                        {verifiedClaims.map((claim, idx) => (
                          <div
                            key={`ver-${idx}`}
                            className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-serif italic font-medium text-ink">
                                &quot;{claim.claim_text}&quot;
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-700" />
                                <span>Chính sử xác thực</span>
                              </span>
                            </div>
                            <p className="text-muted text-[11px] leading-relaxed">{claim.explanation}</p>
                            {claim.source_reference && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-700/80 font-mono">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span>{claim.source_reference}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBypassSoftGuardAndRender}
              className="text-xs h-9 px-4 rounded-xl border-border/80 hover:bg-surface-subtle cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.98]"
            >
              <span>Bảo lưu quan điểm, Vẫn tạo video</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplySoftGuardFixAndRender}
              className="text-xs h-9 font-semibold px-5 rounded-xl gap-1.5 bg-accent text-white hover:bg-accent/90 shadow-2xs cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Áp dụng câu sửa của AI &amp; Tạo Video</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Step Transition Notice & Confirmation Modal (emil-design-eng) */}
      <StepTransitionConfirmationDialog
        modalState={transitionModal}
        onClose={() => setTransitionModal(null)}
        onConfirmContinue={handleConfirmTransition}
      />

      {/* 7. First-Time Creator AI Onboarding Modal */}
      <StudioApiKeyOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={handleCloseOnboarding}
        onOpenSettings={handleOpenSettingsFromOnboarding}
      />
    </div>
  );
};
