import React, { useState } from 'react';
import {
  X,
  Headphones,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChannelSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS = [
  {
    q: 'Bao lâu sau khi đổi ảnh bìa hoặc ảnh đại diện thì thính giả thấy?',
    a: 'Hình ảnh được cập nhật ngay lập tức trên máy chủ Cloudinary CDN. Tuy nhiên, một số trình duyệt có thể lưu bộ nhớ đệm (cache) trong khoảng 1-2 phút.',
  },
  {
    q: 'Làm thế nào để nhận tiền từ gói Hội viên VIP?',
    a: 'Doanh thu từ gói Hội viên được hệ thống tự động đối soát vào ngày cuối mỗi tháng và chuyển vào mục "Ví & Thu nhập" của bạn sau khi trừ phí nền tảng.',
  },
  {
    q: 'Tôi có thể thay đổi mức giá gói hội viên VIP không?',
    a: 'Có, bạn có thể chỉnh sửa mức giá bất kỳ lúc nào. Mức giá mới sẽ áp dụng cho các thính giả đăng ký mới hoặc đến kỳ gia hạn tiếp theo.',
  },
];

export const ChannelSupportModal: React.FC<ChannelSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSubject('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#EBE4D8] bg-white p-6 shadow-xl space-y-5 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F0EBE1] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706] shadow-2xs">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 id="support-modal-title" className="font-serif text-lg font-bold text-[#1F1A19]">
                Trung Tâm Hỗ Trợ Nhà Sáng Tạo
              </h3>
              <p className="text-xs text-[#786D66]">
                Đội ngũ Hỗ trợ Sử Ký luôn sẵn sàng đồng hành cùng bạn 24/7.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ hỗ trợ"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#786D66] hover:bg-[#FAF8F5] hover:text-[#1F1A19] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Direct Contact Channels */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-3 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F1A19]">
              <Phone className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Hotline 24/7</span>
            </div>
            <a
              href="tel:19006868"
              className="text-xs font-bold text-[#A31D24] hover:underline block"
            >
              1900 6868
            </a>
            <span className="text-[10px] text-[#786D66] block">Hỗ trợ khẩn cấp</span>
          </div>

          <div className="rounded-xl border border-[#EBE4D8] bg-[#FAF8F5] p-3 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F1A19]">
              <Mail className="h-3.5 w-3.5 text-[#A31D24]" />
              <span>Email Hỗ trợ</span>
            </div>
            <a
              href="mailto:hotro@suky.vn"
              className="text-xs font-bold text-[#A31D24] hover:underline block truncate"
            >
              hotro@suky.vn
            </a>
            <span className="text-[10px] text-[#786D66] block">Phản hồi trong 2h</span>
          </div>
        </div>

        {/* Quick FAQ Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F1A19]">
            <HelpCircle className="h-3.5 w-3.5 text-[#A31D24]" />
            <span>Câu hỏi thường gặp</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#F0EBE1] bg-[#FFFDFB] overflow-hidden text-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-2.5 text-left font-medium text-[#38302E] hover:bg-[#FAF8F5] transition-colors"
                >
                  <span className="pr-2">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-[#786D66] transition-transform duration-200',
                      expandedFaq === idx && 'rotate-180 text-[#A31D24]'
                    )}
                  />
                </button>
                {expandedFaq === idx && (
                  <p className="px-2.5 pb-2.5 pt-0 text-[11.5px] text-[#786D66] leading-relaxed border-t border-[#F0EBE1]/60">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Form */}
        {isSubmitted ? (
          <div className="rounded-xl border border-[#A6E9B9] bg-[#EDFDF2] p-4 text-center space-y-1">
            <CheckCircle2 className="h-7 w-7 text-[#168A4E] mx-auto" />
            <h4 className="text-xs font-bold text-[#168A4E]">
              Yêu cầu đã được gửi thành công!
            </h4>
            <p className="text-[11px] text-[#168A4E]/80">
              Chuyên viên hỗ trợ Sử Ký sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1F1A19] block">
                Tiêu đề thắc mắc
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Cần hỗ trợ cấu hình gói hội viên..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-white focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#1F1A19] block">
                Nội dung chi tiết
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả sự cố hoặc yêu cầu cần được giải đáp..."
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-white focus:outline-none focus:ring-2 focus:ring-[#A31D24]/20 focus:border-[#A31D24]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E0D8] text-[#5C524C] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#A31D24] text-white hover:bg-[#85171D] transition-colors cursor-pointer active:scale-95 shadow-2xs"
              >
                <Send className="h-3 w-3" />
                <span>Gửi yêu cầu</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
