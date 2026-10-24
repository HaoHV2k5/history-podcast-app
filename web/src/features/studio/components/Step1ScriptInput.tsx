import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  FileCheck2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Key,
  Scroll,
  Clock,
  Landmark,
  Swords,
  Feather,
  Compass,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScriptVerificationResponse } from '@/types/creatorStudio';
import { InputClassificationResult } from '../creatorStudioUtils';

export interface HistoricalTopicItem {
  id: string;
  dynasty: 'ly' | 'tran';
  dynastyName: string;
  title: string;
  figure: string;
  desc: string;
  era: string;
  sourceBook: string;
  sourceVolume: string;
  excerpt: string;
  suggestedDuration: number;
  tags: string[];
}

export const HISTORICAL_SCOPE_SUGGESTIONS: HistoricalTopicItem[] = [
  {
    id: 'doi-do-1010',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)',
    figure: 'Vua Lý Thái Tổ (Lý Công Uẩn)',
    desc: 'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ cố đô Hoa Lư ra thành Đại La. Thuyền ngự vừa đỗ dưới chân thành thì có rồng vàng bay vút lên trời xanh, nhân đó đổi tên Đại La thành Thăng Long.',
    era: 'Năm Canh Tuất 1010',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển II',
    excerpt: 'Vua thấy thành cũ Đại La ở giữa khu vực trời đất, có thế rồng cuộn hổ ngồi, chính giữa nam bắc đông tây, tiện nghi núi sông sau trước... Muôn vật hết sức tươi tốt phồn thịnh.',
    suggestedDuration: 60,
    tags: ['Chiếu Dời Đô', 'Thăng Long', 'Rồng Vàng', 'Định Đô'],
  },
  {
    id: 'nhu-nguyet-1077',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Phòng Tuyến Sông Như Nguyệt Năm 1077',
    figure: 'Thái úy Lý Thường Kiệt',
    desc: 'Thái úy Lý Thường Kiệt lãnh đạo cuộc kháng chiến chống 30 vạn quân Tống xâm lược. Đêm trên sông Như Nguyệt vang vọng bài thơ thần Nam Quốc Sơn Hà, khẳng định chủ quyền độc lập của giang sơn Đại Việt.',
    era: 'Năm Đinh Tỵ 1077',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển III',
    excerpt: 'Nam quốc sơn hà Nam đế cư / Tiệt nhiên định phận tại thiên thư / Như hà nghịch lỗ lai xâm phạm / Nhữ đẳng hành khan thủ bại hư.',
    suggestedDuration: 60,
    tags: ['Sông Như Nguyệt', 'Nam Quốc Sơn Hà', 'Kháng Tống', 'Thơ Thần'],
  },
  {
    id: 'bach-dang-1288',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Đại Thắng Bạch Đằng Năm 1288 (Trần Quốc Tuấn)',
    figure: 'Hưng Đạo Đại Vương Trần Quốc Tuấn',
    desc: 'Trận thủy chiến cọc ngầm lịch sử trên sông Bạch Đằng, Hưng Đạo Vương đón thủy triều rút, đại phá thủy binh Mông - Nguyên do Ô Mã Nhi chỉ huy, bắt sống tướng giặc, giữ vững non sông Đại Việt.',
    era: 'Tháng 3 năm Mậu Tý 1288',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển V',
    excerpt: 'Hưng Đạo Vương đón đánh quân Nguyên, giả cách thua chạy. Quân giặc đuổi theo, thuyền giặc xô vào cọc nhọn bị vỡ đắm... Bắt sống Ô Mã Nhi, Phàn Tiếp dâng lên Thượng hoàng.',
    suggestedDuration: 60,
    tags: ['Trận Bạch Đằng', 'Cọc Ngầm', 'Ô Mã Nhi', 'Thủy Chiến'],
  },
  {
    id: 'dien-hong-1285',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Hội Nghị Diên Hồng & Hịch Tướng Sĩ (1285)',
    figure: 'Thượng hoàng Trần Thánh Tông & Hưng Đạo Vương',
    desc: 'Trước họa xâm lược của 50 vạn quân Thoát Hoan, triều đình mở hội nghị Diên Hồng hỏi ý muôn dân, muôn người đồng thanh hô Đánh. Tinh thần Sát Thát quật khởi chỉ huy quân dân 3 lần toàn thắng giặc Nguyên.',
    era: 'Năm Ất Dậu 1285',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển V',
    excerpt: 'Thượng hoàng triệu các phụ lão trong cả nước về điện Diên Hồng ban yến và hỏi kế đánh giặc. Các phụ lão đều hô to: Đánh! Tiếng vang như sấm dậy trời đất.',
    suggestedDuration: 60,
    tags: ['Hội Nghị Diên Hồng', 'Sát Thát', 'Hịch Tướng Sĩ', 'Ý Đảng Lòng Dân'],
  },
];

interface Step1ScriptInputProps {
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

export const Step1ScriptInput: React.FC<Step1ScriptInputProps> = ({
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
  onVerifyScript,
  isVerifyingScript,
  verifyScriptError,
  verificationResult,
  onApplyRevisedScript,
  copiedKey,
  onCopy,
  onOpenSettings,
  onClearError,
}) => {
  const [showRevisedScript, setShowRevisedScript] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Creative Mode: 'ai_prompt' (Default & easiest) vs 'manual_script' (For full script paste)
  const [creationMode, setCreationMode] = useState<'ai_prompt' | 'manual_script'>(
    scriptContent.length > 120 ? 'manual_script' : 'ai_prompt'
  );

  // Dynasty Filter: 'all' | 'ly' | 'tran'
  const [selectedDynasty, setSelectedDynasty] = useState<'all' | 'ly' | 'tran'>('all');

  // Narrative Tone: 'epic' | 'intimate' | 'academic'
  const [narrativeTone, setNarrativeTone] = useState<'epic' | 'intimate' | 'academic'>('epic');

  const effectiveInput = scriptTopic.trim() || scriptContent.trim();
  const isInputEmpty = !effectiveInput;

  // Find active suggestion item for rich historical preview
  const activeHistoricalItem =
    HISTORICAL_SCOPE_SUGGESTIONS.find(
      (item) => item.title === scriptTopic || item.title === scriptContent
    ) || HISTORICAL_SCOPE_SUGGESTIONS[0];

  // Filter suggestions by dynasty
  const filteredSuggestions = HISTORICAL_SCOPE_SUGGESTIONS.filter((item) => {
    if (selectedDynasty === 'all') return true;
    return item.dynasty === selectedDynasty;
  });

  // Error Classification & Diagnostics
  const activeError = generateStoryboardError || verifyScriptError;

  React.useEffect(() => {
    if (activeError) {
      setIsErrorModalOpen(true);
    }
  }, [activeError]);

  const rawErrorMessage =
    (activeError as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    activeError?.message ||
    '';

  const isScopeError =
    rawErrorMessage.includes('LÝ - TRẦN') ||
    rawErrorMessage.includes('Lý - Trần') ||
    rawErrorMessage.includes('ngoài phạm vi') ||
    rawErrorMessage.includes('OutOfScope') ||
    rawErrorMessage.includes('CHỦ ĐỀ BỊ TỪ CHỐI');

  const isKeyError =
    rawErrorMessage.includes('Gemini API Key') ||
    rawErrorMessage.includes('API Key') ||
    rawErrorMessage.includes('Cài đặt');

  const cleanMessage = rawErrorMessage
    .replace(/^Lỗi tạo kịch bản:\s*/i, '')
    .replace(/^Lỗi thẩm định kịch bản:\s*/i, '')
    .replace(/^⚠️\s*/, '')
    .trim();

  return (
    <div className="space-y-6">
      {/* 1. Dynasty Context Ribbon (Anti-AI-Slop Scope Guide) */}
      <div className="rounded-xl border border-border bg-surface p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
            <Compass className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">Không Gian Sử Liệu Chính Thống</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-soft text-accent border border-accent/20">
                Lý – Trần (1009 – 1400)
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              Hệ thống RAG đã lập chỉ mục toàn bộ thư tịch <em>Đại Việt Sử Ký Toàn Thư</em> &amp; <em>Khâm Định Việt Sử</em>.
            </p>
          </div>
        </div>

        {/* Dynasty Tabs */}
        <div className="flex items-center gap-1.5 self-start md:self-center">
          <button
            type="button"
            onClick={() => setSelectedDynasty('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedDynasty === 'all'
                ? 'bg-accent text-canvas font-bold shadow-xs'
                : 'bg-surface-subtle text-muted hover:text-ink'
            }`}
          >
            Tất cả đề tài ({HISTORICAL_SCOPE_SUGGESTIONS.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedDynasty('ly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedDynasty === 'ly'
                ? 'bg-accent text-canvas font-bold shadow-xs'
                : 'bg-surface-subtle text-muted hover:text-ink'
            }`}
          >
            <Landmark className="h-3 w-3" />
            <span>Triều Lý (1009–1225)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDynasty('tran')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedDynasty === 'tran'
                ? 'bg-accent text-canvas font-bold shadow-xs'
                : 'bg-surface-subtle text-muted hover:text-ink'
            }`}
          >
            <Swords className="h-3 w-3" />
            <span>Triều Trần (1225–1400)</span>
          </button>
        </div>
      </div>

      {/* 2. Split Studio Layout: Left (Forge) & Right (Historical Dossier & RAG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Storytelling Forge */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-6">
            {/* Mode Switcher */}
            <div className="space-y-3 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Feather className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-ink">Bàn Sáng Tác Ký Sự Lịch Sử</h3>
                    <p className="text-[11px] text-muted">Lựa chọn phương thức bạn muốn khởi tạo kịch bản thuyết minh</p>
                  </div>
                </div>

                {wordCount > 0 && (
                  <div className="text-xs font-mono text-muted tabular-nums">
                    {wordCount} từ • ~{estimatedReadingSec}s đọc
                  </div>
                )}
              </div>

              {/* Segmented Control */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border">
                <button
                  type="button"
                  onClick={() => setCreationMode('ai_prompt')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    creationMode === 'ai_prompt'
                      ? 'bg-surface text-accent shadow-xs border border-border/80'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Đồng Sáng Tác (RAG + AI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreationMode('manual_script')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    creationMode === 'manual_script'
                      ? 'bg-surface text-accent shadow-xs border border-border/80'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Tự Soạn / Dán Kịch Bản Đã Có</span>
                </button>
              </div>
            </div>

            {/* Mode A: AI Prompt Generation */}
            {creationMode === 'ai_prompt' ? (
              <div className="space-y-5">
                {/* Topic Input with Clear button */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span>Đề tài hoặc sự kiện lịch sử bạn muốn tái hiện</span>
                    <span className="text-[11px] text-muted">Có thể chỉnh sửa hoặc gõ đề tài mới</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ví dụ: Đại lễ dời đô năm 1010 của vua Lý Thái Tổ..."
                      value={scriptTopic || scriptContent}
                      onChange={(e) => {
                        setScriptTopic(e.target.value);
                        setScriptContent(e.target.value);
                      }}
                      className="text-xs h-11 px-3.5 pr-10 bg-surface-subtle/40 border-border focus:border-accent font-medium text-ink"
                    />
                    {(scriptTopic || scriptContent) && (
                      <button
                        type="button"
                        onClick={() => {
                          setScriptTopic('');
                          setScriptContent('');
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded-md"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Canonical Quick-Picks Cards */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted block">
                      Chọn nhanh đề tài tiêu biểu chuẩn sử liệu (1-Click áp dụng):
                    </span>
                    <span className="text-[10px] text-accent font-mono">Đã đối chiếu RAG</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredSuggestions.map((item) => {
                      const isSelected = scriptTopic === item.title || scriptContent === item.title;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setScriptTopic(item.title);
                            setScriptContent(item.desc);
                            setStoryboardDuration(item.suggestedDuration);
                          }}
                          className={`p-3 rounded-xl border text-left card-hover-lift transition-all duration-200 group flex items-start gap-2.5 cursor-pointer active:scale-[0.99] ${
                            isSelected
                              ? 'border-accent bg-accent-soft/40 shadow-glow-accent ring-2 ring-accent/30 scale-[1.01]'
                              : 'border-border bg-surface hover:border-accent/50 hover:bg-surface-subtle/50 hover:shadow-subtle'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 rounded-lg items-center justify-center shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110 ${
                              isSelected
                                ? 'bg-accent text-canvas scale-105'
                                : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-canvas'
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-bold truncate transition-colors ${
                                  isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
                                }`}
                              >
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-muted">
                              <span>{item.figure}</span>
                              <span>•</span>
                              <span>{item.era}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Narrative Tone Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-ink">
                    Phong cách lời dẫn thuyết minh (Narrative Tone)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'epic', label: 'Hào sảng, sử thi', sub: 'Chiến trận, mở cõi' },
                      { id: 'intimate', label: 'Sâu lắng, tự sự', sub: 'Ký sự, nhân sinh' },
                      { id: 'academic', label: 'Khách quan, học thuật', sub: 'Tra cứu, sử học' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setNarrativeTone(tone.id as 'epic' | 'intimate' | 'academic')}
                        className={`p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer active:scale-95 ${
                          narrativeTone === tone.id
                            ? 'border-accent bg-accent text-canvas font-bold shadow-xs ring-2 ring-accent/30 scale-[1.02]'
                            : 'border-border bg-surface text-muted hover:text-ink hover:bg-surface-subtle hover:-translate-y-0.5'
                        }`}
                      >
                        <span className="text-xs font-bold block">{tone.label}</span>
                        <span className={`text-[10px] block ${narrativeTone === tone.id ? 'text-canvas/80' : 'text-muted'}`}>
                          {tone.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Pacing Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span>Thời lượng video &amp; Nhịp độ podcast mục tiêu</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { dur: 30, desc: '1 cảnh • ~75 từ' },
                      { dur: 60, desc: '2 cảnh • ~150 từ (Đề xuất)' },
                      { dur: 90, desc: '3 cảnh • ~225 từ' },
                      { dur: 120, desc: '4 cảnh • ~300 từ' },
                    ].map(({ dur, desc }) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setStoryboardDuration(dur)}
                        className={`p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer active:scale-95 ${
                          storyboardDuration === dur
                            ? 'border-accent bg-accent text-canvas font-bold shadow-xs ring-2 ring-accent/30 scale-[1.02]'
                            : 'border-border bg-surface text-muted hover:text-ink hover:bg-surface-subtle hover:-translate-y-0.5'
                        }`}
                      >
                        <span className="text-xs font-bold block">{dur} giây</span>
                        <span className={`text-[10px] block ${storyboardDuration === dur ? 'text-canvas/80' : 'text-muted'}`}>
                          {desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-muted">
                    Sau khi AI tạo xong, hệ thống sẽ tự động mở khóa Bước 2 (Phân cảnh &amp; Lời dẫn).
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={onGenerateStoryboard}
                    disabled={isInputEmpty || isGeneratingStoryboard}
                    className="gap-2 text-xs font-semibold px-6 h-10 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 shrink-0"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGeneratingStoryboard ? 'animate-spin' : 'animate-pulse'}`} />
                    <span>
                      {isGeneratingStoryboard ? 'Đang tra cứu tư liệu & tạo phân cảnh...' : 'Khởi Tạo Kịch Bản & Sang Bước 2 →'}
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Mode B: Manual Script Paste */
              <div className="space-y-5">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink flex items-center justify-between">
                    <span>Tiêu đề tác phẩm</span>
                    <span className="text-[11px] text-muted font-normal">Tùy chọn</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Ví dụ: Đại lễ dời đô năm 1010 và Khát vọng Thăng Long ngàn năm"
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                    className="text-xs h-9 bg-surface-subtle/40 border-border"
                  />
                </div>

                {/* Main Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink flex items-center gap-1">
                      <span>Nội dung kịch bản thuyết minh</span>
                      <span className="text-status-error-text">*</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setScriptTopic('Chiếu Dời Đô 1010 và Khát Vọng Thăng Long');
                          setScriptContent(sampleScript);
                        }}
                        className="text-[11px] h-6 px-2 text-accent hover:bg-accent-soft"
                      >
                        Nạp mẫu Dời Đô 1010
                      </Button>
                      {scriptContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setScriptContent('');
                            setScriptTopic('');
                          }}
                          className="text-[11px] h-6 px-2 text-muted hover:text-ink"
                        >
                          Xóa trắng
                        </Button>
                      )}
                    </div>
                  </div>

                  <Textarea
                    rows={8}
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    placeholder="Dán toàn văn kịch bản thuyết minh lịch sử tại đây..."
                    className="text-xs font-sans leading-relaxed min-h-[160px] bg-surface-subtle/30 border-border focus:border-accent"
                  />

                  <div className="p-3 rounded-lg bg-surface-subtle/60 border border-border/80 text-[11px] text-muted">
                    Hệ thống sẽ giữ nguyên 100% nội dung kịch bản của bạn và tự động chia thành các phân cảnh phù hợp với thời lượng đã chọn.
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-ink">
                    Thời lượng video mục tiêu
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 60, 90, 120].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setStoryboardDuration(dur)}
                        className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                          storyboardDuration === dur
                            ? 'border-accent bg-accent text-canvas font-bold shadow-xs ring-1 ring-accent'
                            : 'border-border bg-surface text-muted hover:text-ink hover:bg-surface-subtle'
                        }`}
                      >
                        {dur} giây ({dur / 30} cảnh)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onVerifyScript}
                    disabled={isInputEmpty || isVerifyingScript || isGeneratingStoryboard}
                    className="gap-2 text-xs border-border hover:bg-surface-subtle transition-all duration-200 active:scale-95"
                  >
                    <FileCheck2 className={`h-3.5 w-3.5 text-accent ${isVerifyingScript ? 'animate-spin' : ''}`} />
                    <span>{isVerifyingScript ? 'Đang đối chiếu RAG...' : 'Thẩm định sử liệu (RAG AI)'}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={onGenerateStoryboard}
                    disabled={isInputEmpty || isGeneratingStoryboard || isVerifyingScript}
                    className="gap-2 text-xs font-semibold px-5 shadow-glow-accent shimmer-button bg-accent text-canvas hover:bg-accent/90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGeneratingStoryboard ? 'animate-spin' : 'animate-pulse'}`} />
                    <span>
                      {isGeneratingStoryboard
                        ? 'Đang phân tích kịch bản & phân cảnh...'
                        : 'Tiếp tục: Chuyển sang Bước 2 (Phân Cảnh) →'}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* Subtle error indicator if modal was closed */}
            {activeError && !isErrorModalOpen && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-status-error-text/30 bg-status-error-bg/30 text-xs text-status-error-text animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-status-error-text" />
                  <span className="truncate">
                    {isScopeError ? 'Chủ đề chưa thuộc thời Lý - Trần được hỗ trợ' : cleanMessage || 'Có thông báo lỗi từ máy chủ'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsErrorModalOpen(true)}
                  className="text-[11px] h-7 px-2.5 shrink-0 border-status-error-text/30 text-status-error-text hover:bg-status-error-bg/60"
                >
                  Xem chi tiết
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Historical Dossier & Context Radar */}
        <div className="lg:col-span-5 space-y-4">
          {verificationResult ? (
            /* View 1: Fact-checking Results Panel */
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Kết Quả Thẩm Định Sử Liệu
                  </span>
                </div>

                <Badge
                  variant={
                    verificationResult.overall_score >= 80
                      ? 'success'
                      : verificationResult.overall_score >= 50
                      ? 'pending'
                      : 'error'
                  }
                >
                  {verificationResult.overall_score}/100 Điểm
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle text-xs space-y-1">
                <span className="font-semibold text-ink block">Đánh giá chung:</span>
                <p className="text-muted leading-relaxed">{verificationResult.summary}</p>
              </div>

              {/* Claims breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink block">Chi tiết các khẳng định lịch sử:</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {verificationResult.claims.map((claim, idx) => {
                    const isVerified =
                      claim.verdict === 'verified' || claim.verdict === 'CORRECT' || claim.verdict === 'ACCURATE';
                    const isError =
                      claim.verdict === 'error' || claim.verdict === 'INACCURATE' || claim.verdict === 'CRITICAL_ERROR';
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          isVerified
                            ? 'border-status-success-text/30 bg-status-success-bg/20'
                            : isError
                            ? 'border-status-error-text/30 bg-status-error-bg/20'
                            : 'border-status-warning-text/30 bg-status-warning-bg/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-ink flex-1 leading-snug">{claim.claim_text}</p>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                              isVerified
                                ? 'text-status-success-text bg-status-success-bg'
                                : isError
                                ? 'text-status-error-text bg-status-error-bg'
                                : 'text-status-warning-text bg-status-warning-bg'
                            }`}
                          >
                            {claim.verdict}
                          </span>
                        </div>
                        {claim.explanation && (
                          <p className="text-[11px] text-muted leading-relaxed">{claim.explanation}</p>
                        )}
                        {claim.source_reference && (
                          <div className="text-[10px] text-accent font-medium flex items-center gap-1 pt-0.5">
                            <BookOpen className="h-3 w-3" />
                            <span>{claim.source_reference}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revised Script Suggestion */}
              {verificationResult.revised_script && (
                <div className="pt-2 border-t border-border space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevisedScript(!showRevisedScript)}
                    className="w-full text-xs justify-between border-accent/40 text-accent hover:bg-accent-soft/30"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Xem kịch bản đề xuất đã chuẩn hóa sử liệu</span>
                    </span>
                    {showRevisedScript ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>

                  {showRevisedScript && (
                    <div className="p-3 rounded-lg bg-surface-subtle border border-border text-xs space-y-2">
                      <p className="font-sans leading-relaxed text-ink/90 whitespace-pre-line text-[11px]">
                        {verificationResult.revised_script}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onApplyRevisedScript(verificationResult.revised_script!)}
                        className="w-full text-xs h-7 gap-1.5 bg-accent text-canvas hover:bg-accent/90"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Áp dụng kịch bản chuẩn hóa này</span>
                      </Button>
                    </div>
                  )}
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
                      onClick={() => onCopy(verificationResult.thumbnail_prompt!, 'thumb_prompt_ver')}
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
          ) : (
            /* View 2: Historical Dossier & Context Radar (Linear/Substack editorial inspection) */
            <div
              className={`rounded-xl border border-border bg-surface p-5 shadow-xs space-y-5 transition-all duration-300 relative overflow-hidden ${
                isGeneratingStoryboard || isVerifyingScript
                  ? 'scanline-effect border-accent/40 shadow-glow-accent'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <Scroll className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Hồ Sơ Tư Liệu Lịch Sử
                  </span>
                </div>

                <Badge variant="accent" size="sm" className="font-mono text-[10px] animate-pulse-glow">
                  RAG Verified
                </Badge>
              </div>

              {/* Live AI Processing Indicator Banner */}
              {(isGeneratingStoryboard || isVerifyingScript) && (
                <div className="p-3 rounded-xl bg-accent-soft/50 border border-accent/30 text-xs text-accent flex items-center justify-between animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4 animate-spin text-accent" />
                    <span>Đang truy vấn Đại Việt Sử Ký Toàn Thư &amp; phân tích RAG...</span>
                  </div>
                  <div className="flex items-center gap-0.5 h-3">
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                    <span className="sound-bar" />
                  </div>
                </div>
              )}

              {/* Selected Topic Context Card */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-accent block">
                    {activeHistoricalItem.dynastyName}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-ink mt-0.5">
                    {activeHistoricalItem.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                    <span>Nhân vật: <strong>{activeHistoricalItem.figure}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{activeHistoricalItem.era}</span>
                  </div>
                </div>

                {/* Primary Chronicle Excerpt */}
                <div className="p-3.5 rounded-xl bg-surface-subtle/70 border border-border text-xs space-y-2 hover:border-accent/30 transition-colors">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                    <span className="font-bold text-ink">{activeHistoricalItem.sourceBook}</span>
                    <span>{activeHistoricalItem.sourceVolume}</span>
                  </div>
                  <p className="font-serif italic text-ink/90 text-xs leading-relaxed border-l-2 border-accent pl-2.5">
                    &ldquo;{activeHistoricalItem.excerpt}&rdquo;
                  </p>
                </div>

                {/* Key Historical Tags */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted block">Thực thể &amp; Từ khóa lịch sử:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeHistoricalItem.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border text-[11px] text-ink font-medium hover:border-accent/40 transition-colors"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scene Structure Blueprint */}
                <div className="p-3 rounded-xl border border-border/70 bg-surface space-y-2 pt-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-accent" />
                      <span>Cấu Trúc Phân Cảnh Dự Kiến</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted">
                      {storyboardDuration}s ({storyboardDuration / 30} cảnh)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {Array.from({ length: Math.max(1, Math.round(storyboardDuration / 30)) }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-surface-subtle/40 border border-border/50 text-muted hover:bg-surface-subtle/80 hover:translate-x-1 hover:border-border transition-all duration-200 cursor-default"
                      >
                        <span className="font-medium text-ink">
                          Cảnh {i + 1}: {i === 0 ? 'Bối cảnh khởi sự & Nguyên do' : i === 1 ? 'Diễn biến cao trào lịch sử' : i === 2 ? 'Chiến công & Khí thế hào hùng' : 'Tổng kết & Bài học muôn đời'}
                        </span>
                        <span className="font-mono text-[10px] text-accent">~30s</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust Assurance Badge */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-status-success-bg/20 border border-status-success-text/30 text-[11px] text-ink">
                  <CheckCircle2 className="h-4 w-4 text-status-success-text shrink-0" />
                  <span>
                    Chủ đề đã được chứng thực nằm trong phạm vi triều đại được bảo trợ bởi RAG Fact-Checker.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scope / Error Modal Dialog Popup (Dismissable by clicking outside backdrop) */}
      <Dialog
        open={isErrorModalOpen}
        onOpenChange={(open) => {
          setIsErrorModalOpen(open);
          if (!open) {
            onClearError?.();
          }
        }}
      >
        <DialogContent maxWidth="max-w-xl" className="p-0 overflow-hidden border-border bg-surface shadow-modal rounded-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-b from-status-error-bg/70 via-status-error-bg/30 to-surface p-6 pb-4 border-b border-border/80">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-error-bg border border-status-error-text/30 text-status-error-text shrink-0 shadow-xs mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="space-y-1.5 flex-1 min-w-0 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-serif text-base font-bold text-ink">
                    {isScopeError ? 'Chủ Đề Nằm Ngoài Kho Sử Liệu Lý - Trần' : 'Thông Báo Từ Máy Chủ AI Sử Ký'}
                  </DialogTitle>
                  <Badge variant="error" size="sm" className="font-sans font-medium text-[10px]">
                    {isScopeError ? 'ScopeGate RAG' : 'Cần kiểm tra lại'}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted leading-relaxed">
                  {isScopeError
                    ? 'Kho tư liệu số hóa RAG hiện chuyên sâu cho các sự kiện thuộc triều đại Nhà Lý (1009 – 1225) và Nhà Trần (1225 – 1400) để đảm bảo độ chính xác sử học tuyệt đối.'
                    : 'Yêu cầu không thể hoàn tất do dữ liệu kịch bản hoặc cấu hình chưa phù hợp.'}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* System Feedback Callout */}
            <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border text-xs text-ink/90 space-y-1.5 shadow-2xs">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-status-error-text" />
                <span>Phản hồi chi tiết từ AI Fact-Checker:</span>
              </div>
              <p className="text-xs font-sans leading-relaxed text-ink pl-5 whitespace-pre-line select-text">
                {cleanMessage || 'Đã xảy ra lỗi kết nối dịch vụ. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.'}
              </p>
            </div>

            {/* Scope Suggestions (1-Click Recovery) */}
            {isScopeError && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>Gợi ý chủ đề chuẩn sử liệu Lý - Trần (1-Click áp dụng ngay):</span>
                  </span>
                  <span className="text-[10px] text-accent font-medium">Tự động điền kịch bản mẫu</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {HISTORICAL_SCOPE_SUGGESTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setScriptTopic(item.title);
                        setScriptContent(item.desc);
                        setIsErrorModalOpen(false);
                        onClearError?.();
                      }}
                      className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-accent-soft/30 transition-all text-left group flex items-start gap-2.5 cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      <span className="flex h-5 w-5 rounded-md bg-accent/10 text-accent items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent group-hover:text-canvas transition-colors">
                        <Plus className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-ink truncate group-hover:text-accent transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-muted shrink-0">{item.era}</span>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 bg-surface-subtle/50 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-muted">
              Chạm hoặc nhấn ra ngoài màn hình để thoát cửa sổ này
            </span>

            <div className="flex items-center gap-2">
              {onOpenSettings && isKeyError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsErrorModalOpen(false);
                    onOpenSettings();
                  }}
                  className="text-xs h-8 gap-1.5 border-border"
                >
                  <Key className="h-3.5 w-3.5 text-accent" />
                  <span>Cài đặt Gemini Key</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsErrorModalOpen(false);
                  onClearError?.();
                }}
                className="text-xs h-8 px-4 font-medium border-border hover:bg-surface"
              >
                Đã hiểu & Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

