import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  PenLine,
  FileText,
  Clock,
  Check,
  CheckCircle2,
  Copy,
  Volume2,
  Layers,
  Trash2,
  ArrowRight,
  ArrowDown,
  BookOpen,
} from 'lucide-react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScriptVerificationResponse } from '@/types/creatorStudio';
import { InputClassificationResult } from '../creatorStudioUtils';
import { HistoricalTopicItem, HISTORICAL_SCOPE_SUGGESTIONS } from '../historicalScopeData';
import { CreationMode } from './StudioCreationMethodToggle';
import { StudioScopeErrorDialog } from './StudioScopeErrorDialog';

export type { HistoricalTopicItem };
export { HISTORICAL_SCOPE_SUGGESTIONS };

interface Step1ScriptInputProps {
  renderMode?: 'whiteboard' | 'audio_podcast' | null;
  setRenderMode?: (mode: 'whiteboard' | 'audio_podcast') => void;
  creationMode?: CreationMode | null;
  setCreationMode?: (mode: CreationMode) => void;
  scriptTopic: string;
  setScriptTopic: (val: string) => void;
  scriptContent: string;
  setScriptContent: (val: string) => void;
  storyboardDuration: number;
  setStoryboardDuration: (val: number) => void;
  inputClassification: InputClassificationResult;
  wordCount: number;
  estimatedReadingSec: number;
  sampleScript: string;
  onGenerateStoryboard: () => void;
  isGeneratingStoryboard: boolean;
  generateStoryboardError: Error | null;
  onVerifyScript: () => void;
  isVerifyingScript: boolean;
  verifyScriptError: Error | null;
  verificationResult: ScriptVerificationResponse | null;
  onApplyRevisedScript: (revised: string) => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onOpenSettings?: () => void;
  onClearError?: () => void;
}

const DURATION_CHOICES = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s', hint: 'Khuyên dùng', recommended: true },
  { value: 90, label: '90s' },
  { value: 120, label: '120s' },
];

const INSPIRATIONAL_TOPICS = [
  {
    title: 'Chiếu Dời Đô 1010',
    prompt: 'Đại Lễ dời đô năm 1010 của vua Lý Thái Tổ từ Hoa Lư về Thăng Long',
    duration: 60,
  },
  {
    title: 'Như Nguyệt 1077',
    prompt: 'Phòng tuyến sông Như Nguyệt năm 1077 và bài thơ thần Nam Quốc Sơn Hà của Lý Thường Kiệt',
    duration: 60,
  },
  {
    title: 'Diên Hồng 1285',
    prompt: 'Hội nghị Diên Hồng năm 1285 và ý chí muôn người cùng hô Đánh của các bô lão nhà Trần',
    duration: 90,
  },
  {
    title: 'Bạch Đằng 1288',
    prompt: 'Trận thủy chiến Bạch Đằng Giang năm 1288 dưới sự chỉ huy của Quốc công Tiết chế Trần Hưng Đạo',
    duration: 90,
  },
];

export const Step1ScriptInput: React.FC<Step1ScriptInputProps> = ({
  renderMode,
  setRenderMode,
  creationMode: creationModeProp,
  setCreationMode: setCreationModeProp,
  scriptTopic,
  setScriptTopic,
  scriptContent,
  setScriptContent,
  storyboardDuration,
  setStoryboardDuration,
  inputClassification: _inputClassification,
  wordCount,
  estimatedReadingSec,
  sampleScript,
  onGenerateStoryboard,
  isGeneratingStoryboard,
  generateStoryboardError,
  onVerifyScript: _onVerifyScript,
  isVerifyingScript: _isVerifyingScript,
  verifyScriptError,
  verificationResult: _verificationResult,
  onApplyRevisedScript: _onApplyRevisedScript,
  copiedKey: _copiedKey,
  onCopy: _onCopy,
  onOpenSettings,
  onClearError,
}) => {
  const [internalMode, setInternalMode] = useState<CreationMode | null>(() => {
    if (scriptContent.length > 120) return 'manual_script';
    if (scriptTopic.trim()) return 'ai_prompt';
    return null;
  });
  const activeCreationMode = creationModeProp !== undefined ? creationModeProp : internalMode;
  const handleSelectMode = (mode: CreationMode) => {
    if (setCreationModeProp) {
      setCreationModeProp(mode);
    } else {
      setInternalMode(mode);
    }
  };

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Live Timer & Progress State for Storyboard Generation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isGeneratingStoryboard) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGeneratingStoryboard]);

  const getEstimatedProgress = (sec: number): number => {
    if (sec <= 0) return 6;
    if (sec < 10) return 6 + sec * 2.8; // 6 -> 34%
    if (sec < 25) return 34 + (sec - 10) * 2.2; // 34 -> 67%
    if (sec < 40) return 67 + (sec - 25) * 1.5; // 67 -> 89.5%
    return Math.min(96, 90 + (sec - 40) * 0.25);
  };

  const getStageInfo = (sec: number) => {
    if (sec < 8) {
      return {
        stageNumber: 1,
        title: 'Khảo cứu thư tịch cổ & Đối chiếu chính sử',
        subtitle: 'Đang tra cứu tư liệu từ Đại Việt Sử Ký Toàn Thư và các biên niên sử thời Lý – Trần...',
        icon: BookOpen,
      };
    }
    if (sec < 18) {
      return {
        stageNumber: 2,
        title: 'Phác họa bối cảnh & Xác lập niên biểu',
        subtitle: 'Đang đối chiếu sự kiện, niên đại và nhân vật lịch sử để định hình mạch tự sự...',
        icon: Layers,
      };
    }
    if (sec < 32) {
      return {
        stageNumber: 3,
        title: 'Thiết lập cấu trúc phân cảnh & Nhịp điệu',
        subtitle: 'Đang phân tách kịch bản thành từng phân cảnh, nhịp đọc lời bình và chỉ dẫn âm thanh...',
        icon: Clock,
      };
    }
    if (sec < 45) {
      return {
        stageNumber: 4,
        title: 'Đặc tả mỹ thuật tranh & Phục trang cổ phong',
        subtitle: 'Đang phác họa phong cách nét vẽ thủy mặc cổ phong và bối cảnh thị giác từng khung hình...',
        icon: PenLine,
      };
    }
    return {
      stageNumber: 5,
      title: 'Kiểm duyệt văn bản & Hoàn tất bảng phân cảnh',
      subtitle: 'Bản thảo sắp sẵn sàng! Đang hoàn thiện những khâu cuối cùng để đưa vào phòng dựng...',
      icon: CheckCircle2,
    };
  };

  const currentStage = getStageInfo(elapsedSeconds);
  const currentProgress = getEstimatedProgress(elapsedSeconds);

  // Progressive Disclosure: Track which step on the timeline is revealed
  // If user already has a topic or content, start with all steps revealed
  const [revealedStep, setRevealedStep] = useState<number>(() => {
    if (scriptTopic.trim() || scriptContent.trim()) return 4;
    if (renderMode && activeCreationMode) return 3;
    if (renderMode) return 2;
    return 1;
  });

  // GSAP Animation References
  const containerRef = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const titleBoxRef = useRef<HTMLDivElement>(null);

  // Validation: Check that both topic and content (or topic for AI mode) are provided
  const isInputEmpty =
    !renderMode ||
    !activeCreationMode ||
    (activeCreationMode === 'ai_prompt'
      ? !scriptTopic.trim()
      : (!scriptTopic.trim() || !scriptContent.trim()));

  // Active error handling
  const activeError = generateStoryboardError || verifyScriptError;
  useEffect(() => {
    if (activeError) {
      setIsErrorModalOpen(true);
    }
  }, [activeError]);

  // When user inputs content or chooses a topic, unlock Step 4
  useEffect(() => {
    if (activeCreationMode === 'ai_prompt') {
      if (scriptTopic.trim()) {
        setRevealedStep((prev) => Math.max(prev, 4));
      }
    } else if (activeCreationMode === 'manual_script') {
      if (scriptTopic.trim() && scriptContent.trim()) {
        setRevealedStep((prev) => Math.max(prev, 4));
      }
    }
  }, [scriptTopic, scriptContent, activeCreationMode]);

  // GSAP: Animate Step 2 when revealed
  useEffect(() => {
    if (revealedStep >= 2 && step2Ref.current) {
      gsap.fromTo(
        step2Ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  }, [revealedStep >= 2]);

  // GSAP: Animate Step 3 when revealed
  useEffect(() => {
    if (revealedStep >= 3 && step3Ref.current) {
      gsap.fromTo(
        step3Ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  }, [revealedStep >= 3]);

  // GSAP: Animate Step 4 when revealed
  useEffect(() => {
    if (revealedStep >= 4 && step4Ref.current) {
      gsap.fromTo(
        step4Ref.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [revealedStep >= 4]);

  // Handle format selection in Step 1
  const handleSelectFormat = (mode: 'audio_podcast' | 'whiteboard') => {
    setRenderMode?.(mode);
    setRevealedStep((prev) => Math.max(prev, 2));
  };

  // Handle creation mode selection in Step 2
  const handleSelectCreationMode = (mode: CreationMode) => {
    handleSelectMode(mode);
    setRevealedStep((prev) => Math.max(prev, 3));
  };

  // Handle spark click in Step 3
  const handleSelectTopic = (topic: typeof INSPIRATIONAL_TOPICS[0]) => {
    setScriptTopic(topic.prompt);
    setStoryboardDuration(topic.duration);
    setRevealedStep((prev) => Math.max(prev, 4));
    if (titleBoxRef.current) {
      gsap.fromTo(
        titleBoxRef.current,
        { borderColor: '#B83345', scale: 0.995 },
        { borderColor: '#E7E5E4', scale: 1, duration: 0.3, ease: 'power1.out' }
      );
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto">
      {/* Studio Timeline Workspace Card */}
      <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 sm:p-9 shadow-xs">
        <div className="relative pl-1 sm:pl-2">
          
          {/* ─── MỐC 1: ĐỊNH DẠNG TÁC PHẨM (LUÔN HIỆN ĐẦU TIÊN) ───────────── */}
          <div className="relative flex items-start gap-4 sm:gap-6 pb-9">
            {/* Timeline Connecting Line to next step */}
            {revealedStep >= 2 && (
              <div className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-0.5 bg-[#E7E5E4]" />
            )}

            {/* Timeline Node Badge */}
            <div
              className={`relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border-2 font-serif font-bold text-sm shadow-xs transition-colors ${
                renderMode
                  ? 'border-accent bg-accent text-white'
                  : 'border-[#D6D3D1] bg-white text-[#78716C]'
              }`}
            >
              {revealedStep > 1 && renderMode ? <Check className="h-4 w-4 stroke-[2.5]" /> : '1'}
            </div>

            {/* Node Content */}
            <div className="flex-1 min-w-0 space-y-3 pt-0.5">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
                  1. Định dạng tác phẩm
                </h3>
                <p className="text-xs text-muted mt-0.5 font-sans">
                  Chọn loại hình nội dung bạn muốn sản xuất
                </p>
              </div>

              {/* 2 Lựa chọn Định Dạng: Audio Podcast vs Video Hoạt Họa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Lựa chọn A: Audio Podcast */}
                <button
                  type="button"
                  onClick={() => handleSelectFormat('audio_podcast')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
                    renderMode === 'audio_podcast'
                      ? 'border-accent bg-[#FFFBFB] shadow-2xs ring-1 ring-accent/20'
                      : 'border-[#E7E5E4] bg-[#FAF9F6]/50 hover:bg-white hover:border-[#D6D3D1]'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 rounded-xl items-center justify-center shrink-0 transition-colors ${
                      renderMode === 'audio_podcast'
                        ? 'bg-accent text-white shadow-2xs'
                        : 'bg-[#F0ECE1] text-[#78716C]'
                    }`}
                  >
                    <Volume2 className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-sm font-bold text-[#1C1917]">
                        Audio Podcast
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-accent/10 text-accent">
                        Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-snug">
                      Định dạng 1:1 hoặc 9:16, chỉ cần duy nhất 1 ảnh bìa
                    </p>
                  </div>

                  {renderMode === 'audio_podcast' && (
                    <div className="absolute top-3.5 right-3.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Lựa chọn B: Video Hoạt Họa */}
                <button
                  type="button"
                  onClick={() => handleSelectFormat('whiteboard')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
                    renderMode === 'whiteboard'
                      ? 'border-accent bg-[#FFFBFB] shadow-2xs ring-1 ring-accent/20'
                      : 'border-[#E7E5E4] bg-[#FAF9F6]/50 hover:bg-white hover:border-[#D6D3D1]'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 rounded-xl items-center justify-center shrink-0 transition-colors ${
                      renderMode === 'whiteboard'
                        ? 'bg-accent text-white shadow-2xs'
                        : 'bg-[#F0ECE1] text-[#78716C]'
                    }`}
                  >
                    <Layers className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <span className="font-sans text-sm font-bold text-[#1C1917] block">
                      Video Hoạt Họa Bảng Trắng
                    </span>
                    <p className="text-xs text-muted mt-1 leading-snug">
                      Định dạng ngang 16:9, nét vẽ tay từng cảnh trên nền giấy cổ
                    </p>
                  </div>

                  {renderMode === 'whiteboard' && (
                    <div className="absolute top-3.5 right-3.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>

              {/* Nút tiếp tục nếu đang ở bước 1 */}
              {revealedStep === 1 && (
                <div className="pt-1">
                  {renderMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRevealedStep(2)}
                      className="text-xs font-semibold gap-1.5 border-[#E2DDD5] text-ink hover:text-accent hover:border-accent cursor-pointer"
                    >
                      <span>Tiếp tục chọn phương thức kịch bản</span>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <p className="text-xs text-muted flex items-center gap-1.5 pt-0.5">
                      <span>Chọn 1 trong 2 định dạng ở trên để tiếp tục thiết lập kịch bản</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── MỐC 2: PHƯƠNG THỨC NỘI DUNG (HIỆN RA KHI BƯỚC 1 ĐÃ CHỌN) ── */}
          {revealedStep >= 2 && (
            <div ref={step2Ref} className="relative flex items-start gap-4 sm:gap-6 pb-9">
              {/* Timeline Connecting Line to next step */}
              {revealedStep >= 3 && (
                <div className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-0.5 bg-[#E7E5E4]" />
              )}

              {/* Timeline Node Badge */}
              <div
                className={`relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border-2 font-serif font-bold text-sm shadow-xs transition-colors ${
                  activeCreationMode
                    ? 'border-accent bg-accent text-white'
                    : 'border-[#D6D3D1] bg-white text-[#78716C]'
                }`}
              >
                {revealedStep > 2 && activeCreationMode ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  '2'
                )}
              </div>

              {/* Node Content */}
              <div className="flex-1 min-w-0 space-y-3 pt-0.5">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
                    2. Phương thức tạo kịch bản
                  </h3>
                  <p className="text-xs text-muted mt-0.5 font-sans">
                    Chọn cách bạn muốn chuẩn bị nội dung cho tác phẩm
                  </p>
                </div>

                {/* 2 Lựa chọn Phương Thức: Biên soạn cùng AI Sử Ký vs Tự Nhập */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Lựa chọn A: AI Sáng Tác */}
                  <button
                    type="button"
                    onClick={() => handleSelectCreationMode('ai_prompt')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
                      activeCreationMode === 'ai_prompt'
                        ? 'border-accent bg-[#FFFBFB] shadow-2xs ring-1 ring-accent/20'
                        : 'border-[#E7E5E4] bg-[#FAF9F6]/50 hover:bg-white hover:border-[#D6D3D1]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 rounded-xl items-center justify-center shrink-0 transition-colors ${
                        activeCreationMode === 'ai_prompt'
                          ? 'bg-accent text-white shadow-2xs'
                          : 'bg-[#F0ECE1] text-[#78716C]'
                      }`}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <span className="font-sans text-sm font-semibold text-[#1C1917] block">
                        Biên soạn theo đề tài lịch sử
                      </span>
                      <p className="text-xs text-muted mt-1 leading-snug">
                        Chỉ cần nhập tên đề tài, hệ thống sẽ khảo cứu chính sử và xây dựng kịch bản
                      </p>
                    </div>

                    {activeCreationMode === 'ai_prompt' && (
                      <div className="absolute top-3.5 right-3.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Lựa chọn B: Tự Nhập Kịch Bản */}
                  <button
                    type="button"
                    onClick={() => handleSelectCreationMode('manual_script')}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative ${
                      activeCreationMode === 'manual_script'
                        ? 'border-accent bg-[#FFFBFB] shadow-2xs ring-1 ring-accent/20'
                        : 'border-[#E7E5E4] bg-[#FAF9F6]/50 hover:bg-white hover:border-[#D6D3D1]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 rounded-xl items-center justify-center shrink-0 transition-colors ${
                        activeCreationMode === 'manual_script'
                          ? 'bg-accent text-white shadow-2xs'
                          : 'bg-[#F0ECE1] text-[#78716C]'
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <span className="font-sans text-sm font-semibold text-[#1C1917] block">
                        Tự nhập kịch bản có sẵn
                      </span>
                      <p className="text-xs text-muted mt-1 leading-snug">
                        Dán toàn văn kịch bản của bạn, hệ thống cam kết tôn trọng nguyên tác 100%
                      </p>
                    </div>

                    {activeCreationMode === 'manual_script' && (
                      <div className="absolute top-3.5 right-3.5 h-4 w-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Nút tiếp tục hoặc gợi ý nếu đang ở bước 2 */}
                {revealedStep === 2 && (
                  <div className="pt-1">
                    {activeCreationMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setRevealedStep(3)}
                        className="text-xs font-semibold gap-1.5 border-[#E2DDD5] text-ink hover:text-accent hover:border-accent cursor-pointer"
                      >
                        <span>Tiếp tục nhập nội dung</span>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <p className="text-xs text-muted flex items-center gap-1.5 pt-0.5">
                        <span>Chọn 1 trong 2 phương thức ở trên để tiếp tục soạn thảo</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── MỐC 3: NHẬP LIỆU & THỜI LƯỢNG (HIỆN RA KHI BƯỚC 2 ĐÃ CHỌN) ── */}
          {revealedStep >= 3 && (
            <div ref={step3Ref} className="relative flex items-start gap-4 sm:gap-6 pb-9">
              {/* Timeline Connecting Line to next step */}
              {revealedStep >= 4 && (
                <div className="absolute left-[19px] sm:left-[21px] top-11 bottom-0 w-0.5 bg-[#E7E5E4]" />
              )}

              {/* Timeline Node Badge */}
              <div className="relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-accent text-white font-serif font-bold text-sm shadow-xs">
                {revealedStep > 3 && !isInputEmpty ? <Check className="h-4 w-4 stroke-[2.5]" /> : '3'}
              </div>

              {/* Node Content */}
              <div className="flex-1 min-w-0 space-y-4 pt-0.5">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
                    {activeCreationMode === 'ai_prompt'
                      ? '3. Nhập tiêu đề & chọn thời lượng'
                      : '3. Nhập tiêu đề, kịch bản & thời lượng'}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 font-sans">
                    {activeCreationMode === 'ai_prompt'
                      ? 'Nhập tên đề tài lịch sử bạn muốn phát triển'
                      : 'Nhập tiêu đề và dán nội dung kịch bản hoàn chỉnh'}
                  </p>
                </div>

                {/* KHUNG NHẬP LIỆU TƯƠNG ỨNG */}
                {activeCreationMode === 'ai_prompt' ? (
                  /* CHẾ ĐỘ AI: CHỈ CẦN TIÊU ĐỀ + GỢI Ý */
                  <div
                    ref={titleBoxRef}
                    className="rounded-2xl border border-[#E7E5E4] bg-[#FAF9F6]/50 p-4 sm:p-5 space-y-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink flex items-center gap-1.5 font-sans">
                        <PenLine className="h-3.5 w-3.5 text-accent" />
                        <span>Tiêu đề đề tài lịch sử:*</span>
                      </label>
                      <span className="text-xs text-[#A8A29E] font-sans tabular-nums">
                        {scriptTopic.length}/100
                      </span>
                    </div>

                    <Input
                      id="studio-script-topic-input"
                      type="text"
                      maxLength={100}
                      placeholder="Ví dụ: Đại Lễ Dời Đô 1010, Phòng Tuyến Sông Như Nguyệt 1077..."
                      value={scriptTopic}
                      onChange={(e) => setScriptTopic(e.target.value)}
                      className="h-11 text-sm sm:text-base font-serif bg-white border-[#E7E5E4] focus:border-accent rounded-xl"
                    />

                    {/* 1-Click Topic Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-muted font-medium mr-1 flex items-center gap-1 font-sans">
                        <Sparkles className="h-3 w-3 text-accent" />
                        Gợi ý:
                      </span>
                      {INSPIRATIONAL_TOPICS.map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => handleSelectTopic(item)}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-[#E2DDD5] bg-white text-[#44403C] hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-colors cursor-pointer select-none font-sans"
                          title={item.prompt}
                        >
                          ✦ {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* CHẾ ĐỘ TỰ SOẠN: TIÊU ĐỀ + TEXTAREA KỊCH BẢN */
                  <div className="space-y-3">
                    {/* Tiêu đề */}
                    <div className="rounded-2xl border border-[#E7E5E4] bg-[#FAF9F6]/50 p-4 space-y-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-white transition-all shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-ink flex items-center gap-1.5 font-sans">
                          <PenLine className="h-3.5 w-3.5 text-accent" />
                          <span>Tiêu đề tác phẩm:*</span>
                        </label>
                        <span className="text-xs text-[#A8A29E] font-sans tabular-nums">
                          {scriptTopic.length}/100
                        </span>
                      </div>

                      <Input
                        id="studio-custom-topic-input"
                        type="text"
                        maxLength={100}
                        placeholder="Nhập tiêu đề video..."
                        value={scriptTopic}
                        onChange={(e) => setScriptTopic(e.target.value)}
                        className="h-10 text-sm font-serif bg-white border-[#E7E5E4] focus:border-accent rounded-xl"
                      />
                    </div>

                    {/* Kịch bản chi tiết */}
                    <div className="rounded-2xl border border-[#E7E5E4] bg-[#FAF9F6]/50 p-4 space-y-2.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 focus-within:bg-white transition-all shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-ink flex items-center gap-1.5 font-sans">
                          <FileText className="h-3.5 w-3.5 text-accent" />
                          <span>Toàn văn kịch bản thuyết minh:*</span>
                        </label>

                        <div className="flex items-center gap-2">
                          {scriptContent && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setScriptContent('')}
                              className="text-[11px] h-6 px-2 text-[#78716C] hover:text-red-600 hover:bg-red-50 gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Xóa</span>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setScriptContent(sampleScript);
                              if (!scriptTopic) setScriptTopic('Đại Lễ Dời Đô 1010');
                              setRevealedStep(4);
                            }}
                            className="text-[11px] h-6 px-2 text-accent hover:text-accent-hover hover:bg-accent/5 gap-1 cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Dán mẫu</span>
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        rows={7}
                        placeholder="Dán hoặc viết kịch bản của bạn tại đây..."
                        value={scriptContent}
                        onChange={(e) => setScriptContent(e.target.value)}
                        className="w-full bg-white text-sm font-serif leading-relaxed text-[#1C1917] placeholder:text-[#A8A29E] placeholder:font-sans border border-[#E7E5E4] focus:border-accent rounded-xl p-3 resize-y min-h-[140px]"
                      />

                      <div className="flex items-center justify-between text-xs text-[#78716C] font-sans pt-1">
                        <span>{wordCount} từ</span>
                        <span>~{estimatedReadingSec}s đọc ước tính</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* BỘ CHỌN THỜI LƯỢNG */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-ink flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted" />
                    <span>Thời lượng:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {DURATION_CHOICES.map((opt) => {
                      const isSelected = storyboardDuration === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStoryboardDuration(opt.value)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-accent bg-accent/8 text-accent shadow-2xs font-bold'
                              : 'border-[#E7E5E4] bg-white hover:border-[#D6D3D1] text-[#57534E]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {opt.recommended && (
                            <span className="text-[9px] opacity-75 hidden sm:inline">★</span>
                          )}
                          {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── MỐC 4: KHỞI TẠO TÁC PHẨM (HIỆN RA KHI ĐÃ CÓ TIÊU ĐỀ/KỊCH BẢN) ─ */}
          {revealedStep >= 4 && (
            <div ref={step4Ref} className="relative flex items-start gap-4 sm:gap-6">
              {/* Timeline Node Badge */}
              <div
                className={`relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border-2 font-serif font-bold text-sm shadow-xs transition-all ${
                  isGeneratingStoryboard
                    ? 'border-accent bg-accent text-white ring-4 ring-accent/15 animate-pulse'
                    : !isInputEmpty
                    ? 'border-accent bg-accent text-white'
                    : 'border-[#D6D3D1] bg-white text-[#78716C]'
                }`}
              >
                ✦
              </div>

              {/* Action Content */}
              <div className="flex-1 min-w-0 pt-0.5 space-y-3.5">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[#1C1917] tracking-tight">
                    4. Khởi tạo tác phẩm
                  </h3>
                  <p className="text-xs text-muted mt-0.5 font-sans">
                    {isGeneratingStoryboard
                      ? 'Hệ thống đang tiến hành biên soạn và thiết lập bảng phân cảnh...'
                      : 'Xác nhận thông tin để khởi tạo bảng phân cảnh và lời thuyết minh'}
                  </p>
                </div>

                {!isGeneratingStoryboard ? (
                  <div className="space-y-3 pt-0.5">
                    <Button
                      type="button"
                      size="lg"
                      onClick={onGenerateStoryboard}
                      disabled={isInputEmpty}
                      className="w-full sm:w-auto gap-2.5 text-xs sm:text-sm font-semibold px-8 h-12 rounded-xl bg-accent text-white hover:bg-accent-hover shadow-sm transition-all hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed font-sans"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Tạo Phân Cảnh &amp; Kịch Bản</span>
                      <ArrowRight className="h-4 w-4 ml-0.5" />
                    </Button>

                    {isInputEmpty && (
                      <p className="text-xs text-muted font-sans">
                        {activeCreationMode === 'manual_script'
                          ? !scriptTopic.trim() && !scriptContent.trim()
                            ? 'Vui lòng nhập cả tiêu đề tác phẩm (*) và kịch bản thuyết minh (*)'
                            : !scriptTopic.trim()
                            ? 'Vui lòng nhập tiêu đề tác phẩm (*)'
                            : 'Vui lòng nhập toàn văn kịch bản thuyết minh (*)'
                          : 'Vui lòng nhập tiêu đề đề tài lịch sử (*)'}
                      </p>
                    )}
                  </div>
                ) : (
                  /* ─── UNIFIED ATELIER CREATION CARD (KHI ĐANG BIÊN SOẠN) ─── */
                  <div className="p-5 sm:p-6 rounded-2xl border border-[#E7E2D8] bg-[#FAF8F5] shadow-xs space-y-4 max-w-xl animate-in fade-in duration-300">
                    {/* Header: Stage Icon + Title + Live Elapsed Timer */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E7E2D8] text-accent shrink-0 shadow-2xs">
                          {React.createElement(currentStage.icon, {
                            className: 'h-4 w-4 animate-pulse',
                          })}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent font-sans">
                              Giai đoạn {currentStage.stageNumber}/5
                            </span>
                            <span className="text-[11px] text-[#A8A29E] font-serif">•</span>
                            <span className="text-[11px] text-[#78716C] font-sans">Ước tính ~35–50s</span>
                          </div>
                          <h4 className="font-serif font-semibold text-sm sm:text-base text-ink truncate mt-0.5">
                            {currentStage.title}
                          </h4>
                        </div>
                      </div>

                      {/* Live Counter Pill */}
                      <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#E7E2D8] text-xs text-ink shadow-2xs">
                        <Clock className="h-3.5 w-3.5 text-accent animate-spin-slow" />
                        <span className="font-serif font-semibold text-accent tabular-nums text-sm">
                          {elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}s
                        </span>
                        <span className="text-[#A8A29E] text-[11px] hidden sm:inline font-sans">đã chạy</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#696660] font-sans leading-relaxed">
                      {currentStage.subtitle}
                    </p>

                    {/* Progress Bar with dynamic percentage */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAE5DC] relative">
                        <div
                          className="h-full bg-gradient-to-r from-accent via-[#A82B3C] to-accent transition-all duration-500 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${currentProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/25 animate-pulse" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#78716C] pt-0.5 font-sans">
                        <span className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/40 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                          </span>
                          <span>Đang tinh chỉnh từng phân cảnh...</span>
                        </span>
                        <span className="font-serif font-medium text-accent tabular-nums">
                          {Math.round(currentProgress)}%
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-[#EFEBE4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#78716C]">
                      <span className="italic font-serif text-[11px] text-[#8C827A]">
                        ✦ Sử liệu được đối chiếu theo niên biểu chính thống
                      </span>
                      <span className="text-[11px] text-[#A8A29E] font-sans">
                        Vui lòng giữ màn hình trong giây lát
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ScopeGate & Diagnostics Error Dialog */}
      <StudioScopeErrorDialog
        isOpen={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          onClearError?.();
        }}
        activeError={activeError}
        onRetry={onGenerateStoryboard}
        onSelectHistoricalTopic={(item) => {
          setScriptTopic(item.title);
          if (!activeCreationMode) {
            handleSelectMode('ai_prompt');
          } else if (activeCreationMode === 'ai_prompt') {
            setScriptContent('');
          }
          setStoryboardDuration(item.suggestedDuration);
          setRevealedStep(4);
          setIsErrorModalOpen(false);
          onClearError?.();
        }}
        onOpenSettings={onOpenSettings}
        onApplyCorrection={(correctedText, errors) => {
          if (activeCreationMode === 'manual_script') {
            let updatedContent = scriptContent;
            let updatedTopic = scriptTopic;

            // 1. Thay thế trực tiếp các thực thể sai cụ thể trong cả kịch bản và tiêu đề
            errors.forEach((err) => {
              if (err.wrong && err.correct) {
                if (updatedContent.includes(err.wrong)) {
                  updatedContent = updatedContent.split(err.wrong).join(err.correct);
                }
                if (updatedTopic.includes(err.wrong)) {
                  updatedTopic = updatedTopic.split(err.wrong).join(err.correct);
                }
              }
            });

            // 2. Nếu kịch bản chưa thay đổi được nhưng có correctedText toàn văn
            if (correctedText && updatedContent === scriptContent && updatedTopic === scriptTopic) {
              const prefixMatch = correctedText.match(/^([^:\n]+)[:\-]\s*([^]+)$/);
              if (
                prefixMatch &&
                scriptTopic.trim() &&
                prefixMatch[1].trim().toLowerCase() === scriptTopic.trim().toLowerCase()
              ) {
                updatedTopic = prefixMatch[1].trim();
                updatedContent = prefixMatch[2].trim();
              } else if (scriptContent.trim()) {
                updatedContent = correctedText;
              } else {
                updatedTopic = correctedText;
              }
            }

            setScriptContent(updatedContent);
            setScriptTopic(updatedTopic);
          } else {
            // Chế độ AI Sáng Tác: cập nhật đề tài lịch sử
            let updatedTopic = scriptTopic;
            errors.forEach((err) => {
              if (err.wrong && err.correct && updatedTopic.includes(err.wrong)) {
                updatedTopic = updatedTopic.split(err.wrong).join(err.correct);
              }
            });
            if (correctedText && updatedTopic === scriptTopic) {
              updatedTopic = correctedText;
            }
            setScriptTopic(updatedTopic);
          }

          setIsErrorModalOpen(false);
          onClearError?.();
          setRevealedStep(4);
        }}
        onEditTopic={() => {
          setIsErrorModalOpen(false);
          onClearError?.();
          setTimeout(() => {
            const inputEl = document.querySelector<HTMLInputElement>(
              '#studio-script-topic-input, #studio-custom-topic-input, input[placeholder*="Đại Lễ Dời Đô"], input[placeholder*="tiêu đề video"]'
            );
            if (inputEl) {
              inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              inputEl.focus();
              inputEl.select();
            }
          }, 150);
        }}
      />
    </div>
  );
};
