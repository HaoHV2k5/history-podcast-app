import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Settings,
  BookOpen,
  Volume2,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Layers,
  Copy,
  Check,
  Play,
  Pause,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { creatorStudioApi } from '@/services/api/creatorStudio';
import {
  CreatorAiSetting,
  CreatorVoiceItem,
  StoryboardResponse,
  ScriptVerificationResponse,
} from '@/types/creatorStudio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Pre-filled historical script sample for testing/demonstration
const SAMPLE_HISTORICAL_SCRIPT = `Mùa thu tháng 7 năm Canh Tuất 1010, vua Lý Thái Tổ khởi sự dời đô từ cố đô Hoa Lư ra thành Đại La.
Nhà vua nhận thấy đất Hoa Lư núi non hiểm trở chỉ thích hợp phòng thủ thời loạn lạc, việc hai nhà Đinh và Tiền Lê đóng mãi ở đây khiến thế đại không bền, vận số ngắn ngủi.
Để mưu nghiệp lớn cho muôn đời con cháu, nhà vua ban Chiếu dời đô, chọn Đại La vì đây là nơi trung tâm trời đất, thế đất rồng cuộn hổ ngồi, cao ráo sáng sủa, trăm họ không khổ vì ngập lụt.
Khi thuyền ngự vừa tạm đỗ dưới chân thành Đại La, có điềm lành rồng vàng hiện lên ở thuyền ngự bay vút lên trời xanh. Nhân đó, vua đổi tên Đại La thành Thăng Long, mở ra thời kỳ thái bình thịnh trị cho non sông Đại Việt.`;

export const CreatorStudioPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Active Tab: 'script' | 'storyboard' | 'voices'
  const [activeTab, setActiveTab] = useState<'script' | 'storyboard' | 'voices'>('script');

  // Script Editor State
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptContent, setScriptContent] = useState(SAMPLE_HISTORICAL_SCRIPT);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Storyboard Generator State
  const [storyboardTopic, setStoryboardTopic] = useState('Lý Thái Tổ dời đô năm 1010');
  const [storyboardDuration, setStoryboardDuration] = useState<number>(60);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<StoryboardResponse | null>(null);

  // Historical Verification State
  const [verificationResult, setVerificationResult] = useState<ScriptVerificationResponse | null>(null);
  const [showRevisedScript, setShowRevisedScript] = useState(false);

  // Voice Catalog & Audio Player State
  const [selectedEngineFilter, setSelectedEngineFilter] = useState<'all' | 'edge-tts' | 'elevenlabs'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [elevenKeyInput, setElevenKeyInput] = useState('');
  const [ttsEngineInput, setTtsEngineInput] = useState('edge-tts');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);

  // 1. Fetch AI Settings
  const {
    data: settingsRes,
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['creator', 'studio-settings'],
    queryFn: () => creatorStudioApi.getSettings(),
  });
  const settings: CreatorAiSetting | undefined = settingsRes?.data;

  // Initialize modal input values: do not keep plaintext keys in state, preserve existing credentials
  useEffect(() => {
    if (settings) {
      setGeminiKeyInput('');
      setElevenKeyInput('');
      setTtsEngineInput(settings.ttsEngine || 'edge-tts');
    }
  }, [settings]);

  // 2. Fetch Voice Catalog
  const {
    data: voicesRes,
    isLoading: isLoadingVoices,
  } = useQuery({
    queryKey: ['creator', 'studio-voices'],
    queryFn: () => creatorStudioApi.getVoices(),
  });
  const voices: CreatorVoiceItem[] = Array.isArray(voicesRes?.data) ? voicesRes.data : [];

  // Stop audio playback when unmounting or switching tabs
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 3. Mutation: Save AI Settings
  const saveSettingsMutation = useMutation({
    mutationFn: (payload: { geminiApiKey?: string; elevenlabsApiKey?: string; ttsEngine?: string; voiceName?: string }) =>
      creatorStudioApi.saveSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'studio-settings'] });
      setSettingsSuccessMsg('Đã lưu cấu hình AI thành công!');
      setGeminiKeyInput('');
      setElevenKeyInput('');
      setTimeout(() => {
        setSettingsSuccessMsg(null);
        setIsSettingsOpen(false);
      }, 1200);
    },
  });

  // Audio stream player
  const playAudioStream = (url: string, voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
    audio.onended = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.play().catch(() => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    });
  };

  // Live TTS voice preview mutation
  const previewVoiceMutation = useMutation({
    mutationFn: (req: { engine: string; voiceId: string; text?: string }) =>
      creatorStudioApi.previewVoice(req),
    onSuccess: (res, vars) => {
      setLoadingVoiceId(null);
      if (res.data?.url) {
        let streamUrl = res.data.url;
        if (streamUrl.startsWith('/outputs/')) {
          streamUrl = `http://localhost:8080/api/v1/creator/studio${streamUrl}`;
        } else if (streamUrl.startsWith('/')) {
          streamUrl = `http://localhost:8080${streamUrl}`;
        }
        playAudioStream(streamUrl, vars.voiceId);
      }
    },
    onError: () => {
      setLoadingVoiceId(null);
    },
  });

  // 4. Mutation: Verify Script (Fact-check against RAG)
  const verifyScriptMutation = useMutation({
    mutationFn: (script: string) => creatorStudioApi.verifyScript({ script }),
    onSuccess: (res) => {
      if (res.data) {
        setVerificationResult(res.data);
      }
    },
  });

  // 5. Mutation: Generate Storyboard
  const generateStoryboardMutation = useMutation({
    mutationFn: (payload: { topic: string; durationSec: number }) =>
      creatorStudioApi.generateStoryboard(payload),
    onSuccess: (res) => {
      if (res.data) {
        setGeneratedStoryboard(res.data);
      }
    },
  });

  // Helper: Copy text with feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper: Play voice preview audio (supports CDN URLs and Live TTS synthesis via backend)
  const handlePlayVoice = (voice: CreatorVoiceItem) => {
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If voice has a valid direct HTTP URL (e.g. ElevenLabs CDN)
    if (voice.previewUrl && (voice.previewUrl.startsWith('http://') || voice.previewUrl.startsWith('https://'))) {
      playAudioStream(voice.previewUrl, voice.id);
    } else {
      // Synthesize live sample using Edge-TTS endpoint via Spring Boot & Python tool
      setLoadingVoiceId(voice.id);
      previewVoiceMutation.mutate({
        engine: voice.engine,
        voiceId: voice.id,
        text: voice.sampleText || 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.',
      });
    }
  };

  // Helper: Select voice and save as default
  const handleSelectVoice = (voice: CreatorVoiceItem) => {
    saveSettingsMutation.mutate({
      voiceName: voice.id,
      ttsEngine: voice.engine,
    });
  };

  // Helper: Transfer Storyboard text to Script Editor
  const handleApplyStoryboardToScript = () => {
    if (!generatedStoryboard) return;
    let fullScript = '';
    generatedStoryboard.scenes.forEach((sc) => {
      fullScript += `=== ${sc.scene_title} ===\n`;
      sc.elements.forEach((el) => {
        if (el.subtitle) {
          fullScript += `${el.subtitle}\n`;
        }
      });
      fullScript += '\n';
    });
    setScriptContent(fullScript.trim());
    if (generatedStoryboard.title) {
      setScriptTopic(generatedStoryboard.title);
    }
    setActiveTab('script');
  };

  // Helper: Apply Revised Script from verification
  const handleApplyRevisedScript = () => {
    if (verificationResult?.revised_script) {
      setScriptContent(verificationResult.revised_script);
      setShowRevisedScript(false);
    }
  };

  // Word & Reading time calculation
  const wordCount = scriptContent.trim() ? scriptContent.trim().split(/\s+/).length : 0;
  const estimatedReadingSec = Math.round((wordCount / 150) * 60);

  // Filtered voice catalog
  const filteredVoices = voices.filter((v) => {
    if (selectedEngineFilter === 'all') return true;
    return v.engine === selectedEngineFilter;
  });

  const activeVoiceName = settings?.voiceName || 'vi-VN-NamMinhNeural';
  const currentVoiceObj = voices.find((v) => v.id === activeVoiceName);

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* 1. Header Masthead & Identity */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Xưởng Sáng Tác Sử Ký AI • Whiteboard & Podcast</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Biên Kịch & Phân Cảnh Sử Liệu
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted max-w-2xl leading-relaxed">
            Biên soạn kịch bản podcast, đối chiếu sử liệu gốc triều Lý – Trần với kho RAG, phân cảnh hoạt
            họa bảng trắng và lựa chọn giọng đọc thuyết minh truyền cảm.
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Key status indicator */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              settings?.hasGeminiKey
                ? 'border-status-success-text/30 bg-status-success-bg text-status-success-text'
                : 'border-status-pending-text/30 bg-status-pending-bg text-status-pending-text hover:border-status-pending-text'
            }`}
            title="Nhấp để cấu hình API Key cá nhân"
          >
            <Key className="h-3.5 w-3.5" />
            <span>{settings?.hasGeminiKey ? 'Gemini AI Sẵn sàng' : 'Chưa cấu hình API Key'}</span>
          </div>

          {/* Voice status pill */}
          <div
            onClick={() => setActiveTab('voices')}
            className="cursor-pointer px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium flex items-center gap-1.5 text-ink hover:border-accent/40 transition-colors"
            title="Nhấp để chuyển giọng đọc"
          >
            <Volume2 className="h-3.5 w-3.5 text-accent" />
            <span className="truncate max-w-[130px]">
              {currentVoiceObj?.name || activeVoiceName}
            </span>
          </div>

          {/* Settings button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs h-9 px-3 gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cài đặt AI</span>
          </Button>
        </div>
      </div>

      {/* 2. Historical Knowledgebase Scope Notice */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-2.5">
          <BookOpen className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-ink">
              Kho tri thức sử liệu RAG: Triều đại Nhà Lý (1009 – 1225) & Nhà Trần (1225 – 1400)
            </span>
            <p className="text-muted leading-relaxed">
              Dữ liệu đối chiếu từ nguyên bản: <em>Đại Việt Sử Ký Toàn Thư</em>, <em>An Nam Chí Lược</em> và{' '}
              <em>Đại Việt Sử Lược</em>. Mọi kịch bản đều được thẩm định dựa trên căn cứ văn bản gốc.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono shrink-0 self-start sm:self-auto text-[11px]">
          MANDATORY RAG
        </Badge>
      </div>

      {/* Missing Key Banner (if Gemini key is not set) */}
      {!isLoadingSettings && !settings?.hasGeminiKey && (
        <div className="rounded-xl border border-status-pending-text/30 bg-status-pending-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-status-pending-text">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Cần Google Gemini API Key để kích hoạt AI Studio</span>
              <p className="text-status-pending-text/90 mt-0.5 leading-relaxed">
                Hệ thống yêu cầu API Key cá nhân của Creator để gọi dịch vụ tạo phân cảnh và đối chiếu sử
                liệu RAG. Key được lưu an toàn trong hồ sơ của bạn và không bị công khai.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs shrink-0 bg-status-pending-text text-canvas hover:bg-status-pending-text/90"
          >
            Nhập API Key ngay
          </Button>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'script'
              ? 'border-accent text-accent bg-surface'
              : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Biên Soạn & Thẩm Định Kịch Bản</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storyboard')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'storyboard'
              ? 'border-accent text-accent bg-surface'
              : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Khởi Tạo Phân Cảnh Bảng Trắng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voices')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'voices'
              ? 'border-accent text-accent bg-surface'
              : 'border-transparent text-muted hover:text-ink hover:bg-surface-subtle'
          }`}
        >
          <Volume2 className="h-4 w-4" />
          <span>Thư Viện Giọng Đọc AI ({voices.length})</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: SCRIPT EDITOR & HISTORICAL VERIFICATION */}
      {activeTab === 'script' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-accent" />
                  <span>Nội Dung Kịch Bản Thuyết Minh</span>
                </span>

                <div className="flex items-center gap-2 text-xs text-muted font-mono">
                  <span>{wordCount} từ</span>
                  <span>•</span>
                  <span>~{estimatedReadingSec} giây đọc</span>
                </div>
              </div>

              {/* Topic / Episode title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">
                  Tiêu đề tác phẩm / Chủ đề lịch sử
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Mùa thu dời đô năm 1010 và sự tích Rồng Vàng Thăng Long"
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  className="text-xs h-9 bg-surface"
                />
              </div>

              {/* Script Body textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ink">
                    Lời dẫn kịch bản (Dán hoặc biên soạn kịch bản thuyết minh)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScriptContent(SAMPLE_HISTORICAL_SCRIPT)}
                    className="text-[11px] h-6 px-2 text-accent"
                  >
                    Nạp mẫu Dời Đô 1010
                  </Button>
                </div>
                <Textarea
                  rows={10}
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  placeholder="Nhập nội dung kịch bản sử liệu tại đây..."
                  className="text-xs font-sans leading-relaxed min-h-[220px]"
                />
                <p className="text-[11px] text-muted italic">
                  * Kịch bản trên là nội dung mẫu thử nghiệm. Vui lòng bấm &quot;Thẩm định sử liệu với RAG AI&quot; để đối chiếu thực tế với kho tư liệu chính sử.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScriptContent('')}
                  disabled={!scriptContent}
                  className="text-xs text-muted"
                >
                  Xóa trắng
                </Button>

                <Button
                  size="sm"
                  onClick={() => verifyScriptMutation.mutate(scriptContent)}
                  disabled={!scriptContent.trim() || verifyScriptMutation.isPending}
                  className="gap-2 text-xs"
                >
                  <FileCheck2 className={`h-3.5 w-3.5 ${verifyScriptMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>
                    {verifyScriptMutation.isPending
                      ? 'Đang đối chiếu sử liệu RAG...'
                      : 'Thẩm định sử liệu với RAG AI'}
                  </span>
                </Button>
              </div>

              {/* Verification Error message */}
              {verifyScriptMutation.isError && (
                <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Lỗi thẩm định kịch bản</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    {(verifyScriptMutation.error as Error)?.message ||
                      'Không thể kết nối đến máy chủ thẩm định RAG. Vui lòng kiểm tra lại API Key trong phần Cài đặt.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fact-checking Results Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {verifyScriptMutation.isPending && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-ink">
                    Đang đối chiếu kho tư liệu lịch sử
                  </h3>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    Truy vấn các đoạn sử liệu gốc từ Đại Việt Sử Ký Toàn Thư, An Nam Chí Lược và phân tích
                    từng mệnh đề sự kiện...
                  </p>
                </div>
              </div>
            )}

            {!verifyScriptMutation.isPending && !verificationResult && (
              <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-surface-subtle mx-auto flex items-center justify-center text-muted">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-ink">Báo Cáo Thẩm Định Sử Liệu</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Nhấp vào nút &ldquo;Thẩm định sử liệu với RAG AI&rdquo; để kiểm tra độ chính xác của các mốc
                    thời gian, tên nhân vật, địa lý quân sự và trích dẫn sách sử đối chiếu.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Success View */}
            {!verifyScriptMutation.isPending && verificationResult && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
                {/* Score & Verdict banner */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    {verificationResult.overall_score >= 85 ? (
                      <ShieldCheck className="h-5 w-5 text-status-success-text" />
                    ) : verificationResult.overall_score >= 50 ? (
                      <AlertCircle className="h-5 w-5 text-status-pending-text" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-status-error-text" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-ink block">
                        Điểm Sử Liệu: {verificationResult.overall_score}/100
                      </span>
                      <span className="text-[10px] text-muted">
                        {verificationResult.overall_score >= 85
                          ? 'Chuẩn xác theo sách sử gốc'
                          : verificationResult.overall_score >= 50
                            ? 'Cần hiệu đính chi tiết'
                            : 'Sai lệch sử liệu nghiêm trọng'}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      verificationResult.overall_score >= 85
                        ? 'success'
                        : verificationResult.overall_score >= 50
                          ? 'pending'
                          : 'error'
                    }
                  >
                    {verificationResult.status}
                  </Badge>
                </div>

                {/* Summary Appraisal */}
                <div className="text-xs text-ink bg-surface-subtle p-3 rounded-lg border border-border leading-relaxed">
                  <span className="font-semibold block mb-1 text-muted text-[11px] uppercase tracking-wider">
                    Nhận xét của Cố vấn Thẩm định:
                  </span>
                  {verificationResult.summary}
                </div>

                {/* Claims Analysis breakdown */}
                {verificationResult.claims && verificationResult.claims.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-bold text-ink block">
                      Chi tiết kiểm chứng từng luận điểm ({verificationResult.claims.length}):
                    </span>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {verificationResult.claims.map((claim, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border bg-surface-subtle/50 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink line-clamp-1">
                              &ldquo;{claim.claim_text}&rdquo;
                            </span>
                            <Badge
                              variant={
                                claim.verdict === 'verified'
                                  ? 'success'
                                  : claim.verdict === 'error'
                                    ? 'error'
                                    : 'pending'
                              }
                              className="text-[10px] shrink-0"
                            >
                              {claim.verdict}
                            </Badge>
                          </div>

                          <p className="text-[11px] text-muted leading-relaxed">
                            {claim.explanation}
                          </p>

                          {claim.source_reference && (
                            <div className="text-[10px] text-accent font-medium flex items-center gap-1 pt-0.5">
                              <BookOpen className="h-3 w-3" />
                              <span>{claim.source_reference}</span>
                            </div>
                          )}

                          {claim.suggested_fix && (
                            <div className="p-2 rounded bg-surface border border-border text-[11px] text-ink">
                              <strong className="text-accent">Sửa đổi đề xuất: </strong>
                              {claim.suggested_fix}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revised Script action */}
                {verificationResult.revised_script && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        <span>Bản kịch bản đã chuẩn hóa sử liệu</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRevisedScript(!showRevisedScript)}
                        className="text-[11px] h-6 px-2"
                      >
                        {showRevisedScript ? (
                          <span className="flex items-center gap-1">
                            Thu gọn <ChevronUp className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            Xem trước <ChevronDown className="h-3 w-3" />
                          </span>
                        )}
                      </Button>
                    </div>

                    {showRevisedScript && (
                      <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap">
                        {verificationResult.revised_script}
                      </div>
                    )}

                    <Button
                      size="sm"
                      onClick={handleApplyRevisedScript}
                      className="w-full text-xs gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Áp dụng bản sửa đổi đã chuẩn hóa vào kịch bản</span>
                    </Button>
                  </div>
                )}

                {/* Thumbnail Prompt copy */}
                {verificationResult.thumbnail_prompt && (
                  <div className="pt-2 border-t border-border space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted block">
                      Gợi ý Prompt Ảnh Bìa Podcast (Tỉ lệ 1:1):
                    </span>
                    <div className="relative p-2.5 rounded-lg bg-surface-subtle border border-border text-[11px] font-mono text-muted pr-16 leading-relaxed">
                      <p className="line-clamp-2">{verificationResult.thumbnail_prompt}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(verificationResult.thumbnail_prompt!, 'thumb_prompt_ver')
                        }
                        className="absolute right-2 top-2 h-7 px-2 text-[11px] gap-1"
                      >
                        {copiedKey === 'thumb_prompt_ver' ? (
                          <Check className="h-3 w-3 text-status-success-text" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedKey === 'thumb_prompt_ver' ? 'Đã chép' : 'Chép'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: STORYBOARD GENERATOR */}
      {activeTab === 'storyboard' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-accent" />
                <span>Thiết Lập Phân Cảnh Bảng Trắng (Whiteboard AI)</span>
              </span>
              <span className="text-xs text-muted">
                Tự động chia bố cục 3 khối (Trái – Giữa – Phải) mỗi cảnh
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Topic Input */}
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-medium text-ink">
                  Chủ đề hoặc Dàn ý lịch sử (Triều Lý – Trần)
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Chiến thắng Như Nguyệt năm 1077 của Lý Thường Kiệt"
                  value={storyboardTopic}
                  onChange={(e) => setStoryboardTopic(e.target.value)}
                  className="text-xs h-9 bg-surface"
                />
              </div>

              {/* Duration select */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-medium text-ink">
                  Thời lượng mục tiêu
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 60, 90, 120].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setStoryboardDuration(dur)}
                      className={`h-9 rounded-lg border text-xs font-medium transition-colors ${
                        storyboardDuration === dur
                          ? 'border-accent bg-accent-soft text-accent font-semibold'
                          : 'border-border bg-surface text-muted hover:text-ink'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() =>
                  generateStoryboardMutation.mutate({
                    topic: storyboardTopic,
                    durationSec: storyboardDuration,
                  })
                }
                disabled={!storyboardTopic.trim() || generateStoryboardMutation.isPending}
                className="gap-2 text-xs"
              >
                <Sparkles className={`h-3.5 w-3.5 ${generateStoryboardMutation.isPending ? 'animate-spin' : ''}`} />
                <span>
                  {generateStoryboardMutation.isPending
                    ? 'Đang khởi tạo phân cảnh RAG...'
                    : 'Khởi tạo Phân Cảnh Bảng Trắng'}
                </span>
              </Button>
            </div>

            {/* Error Message */}
            {generateStoryboardMutation.isError && (
              <div className="rounded-lg border border-status-error-text/30 bg-status-error-bg p-3.5 text-xs text-status-error-text space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Không thể tạo phân cảnh</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {(generateStoryboardMutation.error as Error)?.message ||
                    'Đã xảy ra lỗi khi kết nối tới engine tạo phân cảnh. Vui lòng thử lại.'}
                </p>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {generateStoryboardMutation.isPending && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-4 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-accent-soft text-accent mx-auto flex items-center justify-center">
                <RotateCcw className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-ink">Đang phân tích kịch bản và chia cảnh</h3>
                <p className="text-xs text-muted">
                  Hệ thống đang truy xuất tư liệu sử học từ kho sách RAG, căn chỉnh thời lượng 8.5–10s
                  cho từng khối chủ thể...
                </p>
              </div>
            </div>
          )}

          {/* Generated Storyboard Result Display */}
          {!generateStoryboardMutation.isPending && generatedStoryboard && (
            <div className="space-y-6">
              {/* Header result bar */}
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-1 text-[11px]">
                    {generatedStoryboard.scenes.length} Phân Cảnh Hoạt Họa
                  </Badge>
                  <h2 className="font-serif text-lg font-bold text-ink">
                    {generatedStoryboard.title || storyboardTopic}
                  </h2>
                </div>

                <Button
                  size="sm"
                  onClick={handleApplyStoryboardToScript}
                  className="gap-2 text-xs shrink-0"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Chuyển sang Biên Soạn & Thẩm Định</span>
                </Button>
              </div>

              {/* Scenes Cards */}
              <div className="space-y-4">
                {generatedStoryboard.scenes.map((scene) => (
                  <div
                    key={scene.scene_index}
                    className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Cảnh {scene.scene_index}</Badge>
                        <h3 className="font-serif text-sm font-bold text-ink">
                          {scene.scene_title}
                        </h3>
                      </div>

                      {scene.image_prompt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(scene.image_prompt!, `img_prompt_${scene.scene_index}`)
                          }
                          className="text-[11px] h-7 px-2 text-muted hover:text-ink gap-1"
                        >
                          {copiedKey === `img_prompt_${scene.scene_index}` ? (
                            <Check className="h-3 w-3 text-status-success-text" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Prompt 16:9</span>
                        </Button>
                      )}
                    </div>

                    {/* 3 Blocks: Left - Center - Right */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {scene.elements.map((el, elIdx) => (
                        <div
                          key={elIdx}
                          className="rounded-lg border border-border bg-surface-subtle p-3.5 space-y-2 flex flex-col justify-between text-xs"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-ink line-clamp-1">
                                {el.label}
                              </span>
                              <span className="text-[10px] text-muted font-mono">
                                Vị trí: {elIdx === 0 ? 'Trái' : elIdx === 1 ? 'Giữa' : 'Phải'}
                              </span>
                            </div>

                            {el.narrativeRole && (
                              <span className="text-[10px] text-accent font-medium block">
                                {el.narrativeRole}
                              </span>
                            )}

                            <p className="text-xs text-ink/90 leading-relaxed font-sans pt-1">
                              &ldquo;{el.subtitle}&rdquo;
                            </p>
                          </div>

                          {el.visual_desc && (
                            <div className="pt-2 border-t border-border text-[10px] text-muted italic line-clamp-2">
                              {el.visual_desc}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT 3: VOICE CATALOG */}
      {activeTab === 'voices' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-sm font-bold text-ink font-serif">
                Danh Mục Giọng Đọc Thuyết Minh Sử Việt
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Các giọng đọc chuẩn tiếng Việt từ Edge-TTS (miễn phí) và ElevenLabs Studio
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedEngineFilter('all')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedEngineFilter === 'all'
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                Tất cả ({voices.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedEngineFilter('edge-tts')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedEngineFilter === 'edge-tts'
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                Edge-TTS (Miễn phí)
              </button>
              <button
                type="button"
                onClick={() => setSelectedEngineFilter('elevenlabs')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  selectedEngineFilter === 'elevenlabs'
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-muted hover:text-ink'
                }`}
              >
                ElevenLabs Studio
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoadingVoices && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 rounded-xl border border-border bg-surface" />
              ))}
            </div>
          )}

          {/* Voices Grid */}
          {!isLoadingVoices && filteredVoices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map((voice) => {
                const isSelected = activeVoiceName === voice.id;
                const isPlaying = playingVoiceId === voice.id;
                const isLoading = loadingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all bg-surface ${
                      isSelected
                        ? 'border-accent ring-1 ring-accent'
                        : 'border-border hover:border-accent/40'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-bold text-sm text-ink">
                              {voice.name}
                            </span>
                            {isSelected && (
                              <Badge variant="accent" size="sm">
                                Đang chọn
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted block mt-0.5">
                            {voice.accent}
                          </span>
                        </div>

                        <Badge
                          variant={voice.engine === 'edge-tts' ? 'success' : 'default'}
                          className="shrink-0 text-[10px]"
                        >
                          {voice.engine === 'edge-tts' ? 'Free' : 'ElevenLabs'}
                        </Badge>
                      </div>

                      {/* Recommended For */}
                      <p className="text-xs text-ink/80 line-clamp-2 leading-relaxed mt-2">
                        <strong className="text-muted font-medium">Phù hợp: </strong>
                        {voice.recommendedFor}
                      </p>

                      {/* Sample line */}
                      {voice.sampleText && (
                        <div className="mt-2.5 p-2 rounded bg-surface-subtle text-[11px] text-muted italic line-clamp-2">
                          &ldquo;{voice.sampleText}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border">
                      {/* Play Preview button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlayVoice(voice)}
                        disabled={isLoading}
                        className={`text-xs h-7 px-2.5 gap-1.5 ${
                          isPlaying ? 'border-accent text-accent' : 'text-muted hover:text-ink'
                        }`}
                        title="Nghe thử âm thanh mẫu"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Đang tạo...</span>
                          </>
                        ) : isPlaying ? (
                          <>
                            <Pause className="h-3 w-3 fill-current" />
                            <span>Đang phát</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            <span>Nghe thử</span>
                          </>
                        )}
                      </Button>

                      {/* Select Voice button */}
                      <Button
                        variant={isSelected ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleSelectVoice(voice)}
                        disabled={isSelected || saveSettingsMutation.isPending}
                        className="text-xs h-7 px-2.5"
                      >
                        {isSelected ? 'Đang dùng' : 'Chọn giọng'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. SETTINGS DIALOG (MODAL CẤU HÌNH AI) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent maxWidth="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              <span>Cấu Hình Dịch Vụ AI Cho Creator</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted leading-relaxed">
              Nhập API Key cá nhân để kích hoạt bộ công cụ tạo kịch bản, chia cảnh và đối chiếu sử liệu
              RAG. Dữ liệu được bảo mật trên máy chủ cá nhân của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-ink flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-accent" />
                  <span>Google Gemini API Key (Bắt buộc)</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                >
                  <span>Lấy key miễn phí</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder={
                    settings?.hasGeminiKey
                      ? '•••••••••••••••• (Đã cấu hình, để trống nếu không đổi)'
                      : 'AIzaSy... (Nhập Gemini API Key)'
                  }
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="pr-16 text-xs h-9 bg-surface font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="text-[11px] text-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showGeminiKey ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                Dùng cho module RAG đối chiếu sử liệu và khởi tạo phân cảnh kịch bản.
              </p>
            </div>

            {/* ElevenLabs API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-ink flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-accent" />
                  <span>ElevenLabs API Key (Tùy chọn)</span>
                </label>
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-accent hover:underline flex items-center gap-1"
                >
                  <span>Trang chủ</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative">
                <Input
                  type={showElevenKey ? 'text' : 'password'}
                  placeholder={
                    settings?.hasElevenlabsKey
                      ? '•••••••••••••••• (Đã cấu hình, để trống nếu không đổi)'
                      : 'xi-... (Tùy chọn, để trống nếu dùng Edge-TTS)'
                  }
                  value={elevenKeyInput}
                  onChange={(e) => setElevenKeyInput(e.target.value)}
                  className="pr-16 text-xs h-9 bg-surface font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowElevenKey(!showElevenKey)}
                  className="text-[11px] text-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showElevenKey ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                Không bắt buộc. Nếu để trống, hệ thống sử dụng Edge-TTS hoàn toàn miễn phí.
              </p>
            </div>

            {/* Default TTS Engine */}
            <div className="space-y-1.5">
              <label className="font-medium text-ink">Công nghệ giọng đọc mặc định</label>
              <select
                aria-label="Công nghệ giọng đọc mặc định"
                value={ttsEngineInput}
                onChange={(e) => setTtsEngineInput(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-surface px-3 text-xs text-ink focus:outline-none"
              >
                <option value="edge-tts">Microsoft Edge-TTS (Miễn phí 100%, chuẩn tiếng Việt)</option>
                <option value="elevenlabs">ElevenLabs AI Studio (Hùng tráng & Đa dạng)</option>
              </select>
            </div>

            {/* Success Feedback */}
            {settingsSuccessMsg && (
              <div className="p-3 rounded-lg bg-status-success-bg border border-status-success-text/30 text-xs text-status-success-text flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() =>
                saveSettingsMutation.mutate({
                  geminiApiKey: geminiKeyInput.trim() || undefined,
                  elevenlabsApiKey: elevenKeyInput.trim() || undefined,
                  ttsEngine: ttsEngineInput,
                })
              }
              disabled={saveSettingsMutation.isPending}
              className="text-xs"
            >
              {saveSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
