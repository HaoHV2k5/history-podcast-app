import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Wallet,
  ShieldCheck,
  Building2,
  Calendar,
  Hash,
  RefreshCw,
  Home,
} from 'lucide-react';
import { walletApi } from '@/services/api/wallet';
import { PaymentReturnResponse } from '@/types/wallet';

function formatPayDate(raw?: string | null): string {
  if (!raw || raw.length < 14) return '---';
  // yyyyMMddHHmmss
  const year = raw.substring(0, 4);
  const month = raw.substring(4, 6);
  const day = raw.substring(6, 8);
  const hour = raw.substring(8, 10);
  const minute = raw.substring(10, 12);
  const second = raw.substring(12, 14);
  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

function formatVND(amount?: number | null): string {
  if (amount == null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export const VnpayReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentReturnResponse | null>(null);
  const [countdown, setCountdown] = useState<number>(6);

  // Extract query params into a plain record
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
    return params;
  }, [searchParams]);

  const responseCode = queryParams['vnp_ResponseCode'] || '';
  const bankCode = queryParams['vnp_BankCode'] || 'NCB';
  const rawPayDate = queryParams['vnp_PayDate'] || '';
  const vnpTxnRef = queryParams['vnp_TxnRef'] || '';
  const vnpTransactionNo = queryParams['vnp_TransactionNo'] || queryParams['vnp_BankTranNo'] || '';

  // Parse amount from vnp_Amount (divided by 100) as fallback
  const rawVnpAmount = queryParams['vnp_Amount']
    ? Math.round(Number(queryParams['vnp_Amount']) / 100)
    : 0;

  useEffect(() => {
    let isMounted = true;

    async function verifyPayment() {
      if (Object.keys(queryParams).length === 0) {
        setIsLoading(false);
        setErrorMsg('Không tìm thấy thông tin phản hồi từ cổng VNPay.');
        return;
      }

      try {
        setIsLoading(true);
        setErrorMsg(null);
        const res = await walletApi.handleVnpayReturn(queryParams);
        if (isMounted) {
          if (res.success && res.data) {
            setPaymentData(res.data);
          } else {
            setErrorMsg(res.message || 'Không thể xác thực kết quả thanh toán từ VNPay.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const e = err as { response?: { data?: { message?: string } } };
          // If error occurs, still check responseCode from URL to show contextual status
          if (responseCode === '00') {
            setPaymentData({
              merchantTxnRef: vnpTxnRef,
              gatewayTxnNo: vnpTransactionNo,
              amount: rawVnpAmount,
              status: 'SUCCESS',
              message: 'Giao dịch nạp tiền thành công.',
            });
          } else {
            setErrorMsg(
              e.response?.data?.message ||
                'Đã xảy ra lỗi khi đối soát kết quả giao dịch với máy chủ.'
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [queryParams, responseCode, vnpTxnRef, vnpTransactionNo, rawVnpAmount]);

  const isSuccess =
    responseCode === '00' &&
    (!paymentData || paymentData.status !== 'FAILED') &&
    !errorMsg;

  // Auto redirect countdown on success
  useEffect(() => {
    if (!isSuccess || isLoading) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/creator/wallet');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, isLoading, navigate]);

  const displayAmount = paymentData?.amount || rawVnpAmount;
  const displayTxnRef = paymentData?.merchantTxnRef || vnpTxnRef;
  const displayGatewayNo = paymentData?.gatewayTxnNo || vnpTransactionNo;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 font-sans antialiased select-none">
      <div className="w-full max-w-lg">
        {/* Top Brand Logo & Header */}
        <div className="text-center mb-6 space-y-1">
          <Link
            to="/creator"
            className="inline-flex items-center gap-2 text-[#8B2635] hover:text-[#731E2A] transition-colors"
          >
            <div className="h-8 w-8 rounded-xl bg-[#8B2635] text-white flex items-center justify-center font-serif font-black text-sm shadow-xs">
              Sử
            </div>
            <span className="font-serif font-bold text-lg text-[#1F1A17] tracking-tight">
              Sử Ký Creator Studio
            </span>
          </Link>
          <p className="text-xs text-[#786D66]">
            Cổng kết nối thanh toán điện tử VNPay Sandbox
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#E7E2D8] shadow-apple-dialog overflow-hidden">
          {isLoading ? (
            /* Loading State */
            <div className="p-8 sm:p-10 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF6F0] border border-[#E7E0D3] text-[#8B2635]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-[#1F1A17]">
                  Đang đối soát giao dịch...
                </h3>
                <p className="text-xs text-[#786D66] max-w-sm mx-auto leading-relaxed">
                  Hệ thống đang kiểm tra tính toàn vẹn chữ ký bảo mật và cập nhật số dư ví Sử Ký của bạn.
                </p>
              </div>
            </div>
          ) : isSuccess ? (
            /* Success State */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDFDF2] border border-[#A6E9B9] text-[#168A4E] shadow-2xs">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDFDF2] border border-[#A6E9B9] text-[11px] font-semibold text-[#168A4E]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Giao dịch thành công</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1A17] pt-1">
                    Nạp Tiền Thành Công!
                  </h2>
                  <p className="text-xs text-[#786D66] max-w-sm mx-auto leading-relaxed">
                    Số dư khả dụng trong Ví Creator của bạn đã được cập nhật thành công.
                  </p>
                </div>

                {/* Big Amount Callout */}
                <div className="pt-2">
                  <div className="inline-flex flex-col items-center justify-center rounded-2xl bg-[#FAF8F5] border border-[#EBE4D8] px-6 py-3.5">
                    <span className="text-[11px] text-[#786D66] uppercase tracking-wider font-semibold">
                      Số tiền đã cộng vào ví
                    </span>
                    <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#168A4E] tracking-tight">
                      +{formatVND(displayAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Detail Breakdown */}
              <div className="rounded-2xl border border-[#EFEBE4] bg-[#FDFBF7] p-4 sm:p-5 space-y-3 text-xs">
                <div className="text-[11px] font-bold text-[#786D66] uppercase tracking-wider pb-1 border-b border-[#EFEBE4]">
                  Chi tiết giao dịch
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#786D66] flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-[#A89F91]" />
                    <span>Mã tham chiếu đơn hàng:</span>
                  </span>
                  <span className="font-mono font-semibold text-[#1F1A17]">
                    {displayTxnRef || '---'}
                  </span>
                </div>

                {displayGatewayNo && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#786D66] flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#A89F91]" />
                      <span>Mã GD VNPay:</span>
                    </span>
                    <span className="font-mono font-semibold text-[#1F1A17]">
                      {displayGatewayNo}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#786D66] flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#A89F91]" />
                    <span>Cổng / Ngân hàng:</span>
                  </span>
                  <span className="font-medium text-[#1F1A17]">
                    VNPay • {bankCode}
                  </span>
                </div>

                {rawPayDate && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#786D66] flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#A89F91]" />
                      <span>Thời gian thực hiện:</span>
                    </span>
                    <span className="font-mono text-[#1F1A17]">
                      {formatPayDate(rawPayDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/creator/wallet')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B2635] px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#731E2A] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Quay về Ví Creator ({countdown}s)</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/creator')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-5 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5 text-[#786D66]" />
                  <span>Về Bàn làm việc</span>
                </button>
              </div>
            </div>
          ) : (
            /* Failed / Cancelled State */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] shadow-2xs">
                  <XCircle className="h-9 w-9" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[11px] font-semibold text-[#DC2626]">
                    <span>Giao dịch chưa hoàn tất</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1A17] pt-1">
                    Thanh Toán Không Thành Công
                  </h2>
                  <p className="text-xs text-[#786D66] max-w-sm mx-auto leading-relaxed">
                    {paymentData?.message ||
                      errorMsg ||
                      (responseCode === '24'
                        ? 'Bạn đã hủy bỏ phiên thanh toán tại cổng VNPay.'
                        : 'Giao dịch không thành công hoặc phiên thanh toán đã hết hạn.')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE4D8] text-xs text-[#786D66]">
                  Số tiền trong tài khoản ngân hàng của bạn không bị trừ hoặc sẽ được hoàn lại theo quy định của cổng thanh toán.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/creator/wallet')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#8B2635] px-5 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#731E2A] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Thử lại nạp tiền tại Ví</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/creator')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-5 py-2.5 text-xs font-semibold text-[#38302E] hover:bg-[#FAF8F5] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5 text-[#786D66]" />
                  <span>Về Bàn làm việc</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-[11px] text-[#A89F91]">
          Sử Ký Platform © 2026 • Hỗ trợ kỹ thuật: support@suky.vn
        </div>
      </div>
    </div>
  );
};
