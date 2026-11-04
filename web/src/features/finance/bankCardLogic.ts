import { normalizeVietnamese } from '../withdrawals/withdrawalsLogic.ts';

export interface BankCardTheme {
  code: string;
  shortName: string;
  fullName: string;
  logoUrl?: string;
  bgClass: string;
  borderClass: string;
  accentColor: string;
}

/**
 * Resolves bank card visual style and VietQR official CDN logo based on bank name.
 */
export function resolveBankCardTheme(bankName?: string): BankCardTheme {
  const norm = normalizeVietnamese(bankName || '').toLowerCase();

  // 1. Vietcombank
  if (norm.includes('vietcombank') || norm.includes('vcb') || norm.includes('ngoai thuong')) {
    return {
      code: 'VCB',
      shortName: 'Vietcombank',
      fullName: 'Ngân hàng Ngoại thương Việt Nam',
      logoUrl: 'https://cdn.vietqr.io/img/VCB.png',
      bgClass: 'bg-[#062417]',
      borderClass: 'border-[#0F472F]',
      accentColor: '#10B981',
    };
  }

  // 2. Techcombank
  if (norm.includes('techcombank') || norm.includes('tcb') || norm.includes('ky thuong')) {
    return {
      code: 'TCB',
      shortName: 'Techcombank',
      fullName: 'Ngân hàng Kỹ thương Việt Nam',
      logoUrl: 'https://cdn.vietqr.io/img/TCB.png',
      bgClass: 'bg-[#181515]',
      borderClass: 'border-[#382626]',
      accentColor: '#E53935',
    };
  }

  // 3. MB Bank
  if (norm.includes('mb bank') || norm.includes('mbbank') || norm.includes('quan doi') || /\bmb\b/.test(norm)) {
    return {
      code: 'MB',
      shortName: 'MB Bank',
      fullName: 'Ngân hàng TMCP Quân đội',
      logoUrl: 'https://cdn.vietqr.io/img/MB.png',
      bgClass: 'bg-[#0A1C38]',
      borderClass: 'border-[#173461]',
      accentColor: '#3B82F6',
    };
  }

  // 4. BIDV
  if (norm.includes('bidv') || norm.includes('dau tu va phat trien')) {
    return {
      code: 'BIDV',
      shortName: 'BIDV',
      fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam',
      logoUrl: 'https://cdn.vietqr.io/img/BIDV.png',
      bgClass: 'bg-[#072625]',
      borderClass: 'border-[#0E4A48]',
      accentColor: '#006B68',
    };
  }

  // 5. VietinBank
  if (norm.includes('vietinbank') || norm.includes('ctg') || norm.includes('cong thuong')) {
    return {
      code: 'ICB',
      shortName: 'VietinBank',
      fullName: 'Ngân hàng TMCP Công thương Việt Nam',
      logoUrl: 'https://cdn.vietqr.io/img/ICB.png',
      bgClass: 'bg-[#0A2238]',
      borderClass: 'border-[#123E66]',
      accentColor: '#0288D1',
    };
  }

  // 6. ACB
  if (norm.includes('acb') || norm.includes('a chau')) {
    return {
      code: 'ACB',
      shortName: 'ACB',
      fullName: 'Ngân hàng TMCP Á Châu',
      logoUrl: 'https://cdn.vietqr.io/img/ACB.png',
      bgClass: 'bg-[#091F38]',
      borderClass: 'border-[#133A66]',
      accentColor: '#1976D2',
    };
  }

  // 7. VPBank
  if (norm.includes('vpbank') || norm.includes('vpb') || norm.includes('thinh vuong')) {
    return {
      code: 'VPB',
      shortName: 'VPBank',
      fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
      logoUrl: 'https://cdn.vietqr.io/img/VPB.png',
      bgClass: 'bg-[#082618]',
      borderClass: 'border-[#0F472D]',
      accentColor: '#10B981',
    };
  }

  // 8. TPBank
  if (norm.includes('tpbank') || norm.includes('tpb') || norm.includes('tien phong')) {
    return {
      code: 'TPB',
      shortName: 'TPBank',
      fullName: 'Ngân hàng TMCP Tiên Phong',
      logoUrl: 'https://cdn.vietqr.io/img/TPB.png',
      bgClass: 'bg-[#240E30]',
      borderClass: 'border-[#4A1D63]',
      accentColor: '#792878',
    };
  }

  // 9. Sacombank
  if (norm.includes('sacombank') || norm.includes('stb') || norm.includes('sai gon thuong tin')) {
    return {
      code: 'STB',
      shortName: 'Sacombank',
      fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín',
      logoUrl: 'https://cdn.vietqr.io/img/STB.png',
      bgClass: 'bg-[#082038]',
      borderClass: 'border-[#103A63]',
      accentColor: '#1976D2',
    };
  }

  // 10. Agribank
  if (norm.includes('agribank') || norm.includes('vba') || norm.includes('nong nghiep')) {
    return {
      code: 'VBA',
      shortName: 'Agribank',
      fullName: 'Ngân hàng Nông nghiệp & PTNT Việt Nam',
      logoUrl: 'https://cdn.vietqr.io/img/VBA.png',
      bgClass: 'bg-[#260C0C]',
      borderClass: 'border-[#4D1A1A]',
      accentColor: '#B71C1C',
    };
  }

  // Default / Other bank
  return {
    code: bankName ? bankName.slice(0, 4).toUpperCase() : 'BANK',
    shortName: bankName || 'Ngân hàng liên kết',
    fullName: bankName || 'Tài khoản ngân hàng',
    bgClass: 'bg-[#1F1A19]',
    borderClass: 'border-[#3D3330]',
    accentColor: '#C5BEB3',
  };
}

/**
 * Masks account number for secure digital card display: •••• •••• •••• 6868
 */
export function formatCardNumberDisplay(accountNumber?: string): string {
  if (!accountNumber) return '•••• •••• •••• ••••';
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) {
    return `•••• •••• •••• ${clean}`;
  }
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Formats full account number with 4-digit chunk spacing when unmasked: 9704 2292 1234 4024
 */
export function formatFullCardNumberDisplay(accountNumber?: string): string {
  if (!accountNumber) return '•••• •••• •••• ••••';
  const clean = accountNumber.replace(/\s+/g, '');
  if (!clean) return '•••• •••• •••• ••••';
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Formats cardholder name cleanly in uppercase.
 */
export function formatCardHolderName(name?: string): string {
  if (!name || !name.trim()) return 'CHỦ TÀI KHOẢN';
  return name.trim().toUpperCase();
}
