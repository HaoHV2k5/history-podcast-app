/**
 * Financial & UX logic for Wallet VNPay Deposit Modal
 */

export const MIN_DEPOSIT_AMOUNT = 10000; // 10.000 VNĐ
export const MAX_DEPOSIT_AMOUNT = 50000000; // 50.000.000 VNĐ per transaction

export interface QuickDepositPreset {
  value: number;
  label: string;
}

export const QUICK_DEPOSIT_PRESETS: readonly QuickDepositPreset[] = [
  { value: 50000, label: '50.000 ₫' },
  { value: 100000, label: '100.000 ₫' },
  { value: 200000, label: '200.000 ₫' },
  { value: 500000, label: '500.000 ₫' },
  { value: 1000000, label: '1.000.000 ₫' },
  { value: 2000000, label: '2.000.000 ₫' },
] as const;

/**
 * Format raw number or string with Vietnamese thousand dot separator (e.g. 50000 -> 50.000)
 */
export function formatNumberWithDots(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const cleanStr = String(val).replace(/\D/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
}

/**
 * Parse a dot-formatted string into pure number (e.g. "50.000" -> 50000)
 */
export function parseNumberFromDots(val: string | null | undefined): number {
  if (!val) return 0;
  const clean = val.replace(/\D/g, '');
  if (!clean) return 0;
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Validate deposit amount against business rules
 */
export function validateDepositAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Vui lòng nhập số tiền hợp lệ' };
  }
  if (amount < MIN_DEPOSIT_AMOUNT) {
    return {
      valid: false,
      error: `Số tiền nạp tối thiểu là ${formatNumberWithDots(MIN_DEPOSIT_AMOUNT)} VNĐ`,
    };
  }
  if (amount > MAX_DEPOSIT_AMOUNT) {
    return {
      valid: false,
      error: `Số tiền nạp tối đa là ${formatNumberWithDots(MAX_DEPOSIT_AMOUNT)} VNĐ mỗi giao dịch`,
    };
  }
  if (amount % 1000 !== 0) {
    return {
      valid: false,
      error: 'Số tiền nạp phải là bội số của 1.000 VNĐ',
    };
  }
  return { valid: true };
}

const UNITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(n: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  const parts: string[] = [];

  if (hundred > 0 || showZeroHundred) {
    parts.push(`${UNITS[hundred]} trăm`);
  }

  if (ten > 1) {
    parts.push(`${UNITS[ten]} mươi`);
    if (unit === 1) parts.push('mốt');
    else if (unit === 4) parts.push('tư');
    else if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(UNITS[unit]);
  } else if (ten === 1) {
    parts.push('mười');
    if (unit === 5) parts.push('lăm');
    else if (unit > 0) parts.push(UNITS[unit]);
  } else if (ten === 0 && unit > 0) {
    if (hundred > 0 || showZeroHundred) {
      parts.push('lẻ');
    }
    parts.push(UNITS[unit]);
  }

  return parts.join(' ');
}

/**
 * Converts VND numeric amount into formal Vietnamese words (e.g. 50000 -> "Năm mươi nghìn đồng")
 */
export function convertVNDToWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return '';
  const num = Math.floor(amount);
  if (num === 0) return 'Không đồng';

  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(`${readThreeDigits(billions, false)} tỷ`);
  }
  if (millions > 0) {
    parts.push(`${readThreeDigits(millions, parts.length > 0)} triệu`);
  }
  if (thousands > 0) {
    parts.push(`${readThreeDigits(thousands, parts.length > 0)} nghìn`);
  }
  if (remainder > 0) {
    parts.push(readThreeDigits(remainder, parts.length > 0));
  }

  const result = parts.join(' ').trim();
  if (!result) return '';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}

