/**
 * Validation and business rules for Creator Wallet and Withdrawals.
 */

export function validateWithdrawalAmount(
  amount: number,
  availableBalance: number
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Số tiền rút không hợp lệ' };
  }
  if (amount < 50000) {
    return { valid: false, error: 'Số tiền rút tối thiểu là 50.000 VNĐ' };
  }
  if (amount > availableBalance) {
    return { valid: false, error: 'Số dư khả dụng không đủ để thực hiện rút tiền' };
  }
  return { valid: true };
}

export function validateBankAccount(
  bankName: string,
  accountNumber: string,
  accountHolderName: string
): { valid: boolean; error?: string } {
  if (!bankName || !bankName.trim()) {
    return { valid: false, error: 'Tên ngân hàng không được để trống' };
  }
  const cleanAccNum = accountNumber.replace(/\s+/g, '');
  if (!cleanAccNum || cleanAccNum.length < 6 || cleanAccNum.length > 20 || !/^\d+$/.test(cleanAccNum)) {
    return { valid: false, error: 'Số tài khoản phải gồm 6 đến 20 chữ số' };
  }
  if (!accountHolderName || accountHolderName.trim().length < 2) {
    return { valid: false, error: 'Tên chủ tài khoản phải có ít nhất 2 ký tự' };
  }
  return { valid: true };
}

export function formatTransactionBadge(type: string): { label: string; isPositive: boolean } {
  const upper = (type || '').toUpperCase();
  switch (upper) {
    case 'TOPUP':
      return { label: 'Nạp tiền ví', isPositive: true };
    case 'MEMBERSHIP':
    case 'MEMBERSHIP_REVENUE':
      return { label: 'Doanh thu Hội viên', isPositive: true };
    case 'DONATION':
      return { label: 'Ủng hộ (Donation)', isPositive: true };
    case 'WITHDRAW':
      return { label: 'Rút tiền ngân hàng', isPositive: false };
    case 'ESCROW_LOCK':
      return { label: 'Ký quỹ hợp đồng', isPositive: false };
    case 'ESCROW_RELEASE':
      return { label: 'Nhận giải ngân ký quỹ', isPositive: true };
    default:
      return { label: upper, isPositive: false };
  }
}
