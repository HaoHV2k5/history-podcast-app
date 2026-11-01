import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWithdrawalAmount,
  validateBankAccount,
  formatTransactionBadge,
  shouldDisplayRecentTransactions,
  getRecentTransactionTitle,
} from './financeLogic.ts';
import { maskAccountNumber, formatVND } from '../../utils/formatters.ts';

describe('Creator Finance & Wallet Logic Unit Tests', () => {
  it('Scenario 1: validateWithdrawalAmount accepts valid amounts within available balance', () => {
    const res = validateWithdrawalAmount(100000, 500000);
    assert.equal(res.valid, true);
    assert.equal(res.error, undefined);
  });

  it('Scenario 2: validateWithdrawalAmount rejects amounts below 50,000 VND', () => {
    const res = validateWithdrawalAmount(30000, 500000);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('tối thiểu là 50.000 VNĐ'));
  });

  it('Scenario 3: validateWithdrawalAmount rejects amounts exceeding available balance', () => {
    const res = validateWithdrawalAmount(600000, 500000);
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('Số dư khả dụng không đủ'));
  });

  it('Scenario 4: validateWithdrawalAmount rejects NaN, negative or zero amounts', () => {
    assert.equal(validateWithdrawalAmount(0, 500000).valid, false);
    assert.equal(validateWithdrawalAmount(-50000, 500000).valid, false);
    assert.equal(validateWithdrawalAmount(NaN, 500000).valid, false);
  });

  it('Scenario 5: validateBankAccount accepts well-formatted bank accounts', () => {
    const res = validateBankAccount('Vietcombank', '1029384756', 'NGUYEN VAN A');
    assert.equal(res.valid, true);
  });

  it('Scenario 6: validateBankAccount rejects accounts with non-digit chars or invalid length', () => {
    assert.equal(validateBankAccount('Techcombank', '123', 'NGUYEN VAN A').valid, false);
    assert.equal(validateBankAccount('Techcombank', '12345ABC', 'NGUYEN VAN A').valid, false);
    assert.equal(validateBankAccount('', '1029384756', 'NGUYEN VAN A').valid, false);
    assert.equal(validateBankAccount('MB Bank', '1029384756', 'A').valid, false);
  });

  it('Scenario 7: formatTransactionBadge maps transaction types and positive/negative flows', () => {
    const topup = formatTransactionBadge('TOPUP');
    assert.equal(topup.label, 'Nạp tiền ví');
    assert.equal(topup.isPositive, true);

    const withdraw = formatTransactionBadge('WITHDRAW');
    assert.equal(withdraw.label, 'Rút tiền ngân hàng');
    assert.equal(withdraw.isPositive, false);

    const membership = formatTransactionBadge('MEMBERSHIP');
    assert.equal(membership.label, 'Doanh thu Hội viên');
    assert.equal(membership.isPositive, true);
  });

  it('Scenario 8: break-ui stress test - handles extreme numbers up to 100 billion VND safely', () => {
    const extremeAmount = 100000000000;
    const formatted = formatVND(extremeAmount);
    assert.ok(formatted.includes('100.000.000.000') || formatted.includes('100 tỷ') || formatted.includes('100'));
    const validation = validateWithdrawalAmount(extremeAmount, extremeAmount);
    assert.equal(validation.valid, true);
  });

  it('Scenario 9: break-ui stress test - handles worst-case long account holder names', () => {
    const longName = 'CÔNG TY TNHH MỘT THÀNH VIÊN TRUYỀN THÔNG VÀ SẢN XUẤT NỘI DUNG LỊCH SỬ VIỆT NAM HÀO HÙNG';
    const validation = validateBankAccount('Vietcombank', '102938475612', longName);
    assert.equal(validation.valid, true);
  });

  it('Scenario 10: break-ui stress test - maskAccountNumber handles edge case inputs without crashing', () => {
    assert.equal(maskAccountNumber(null), '—');
    assert.equal(maskAccountNumber(''), '—');
    assert.equal(maskAccountNumber('123'), '123');
    assert.equal(maskAccountNumber('1234'), '1234');
    assert.equal(maskAccountNumber('1029384756'), '••••••••4756');
  });

  it('Scenario 11: formatTransactionBadge handles escrow locks, donations, and fallback safely', () => {
    const escrowLock = formatTransactionBadge('ESCROW_LOCK');
    assert.equal(escrowLock.label, 'Ký quỹ hợp đồng');
    assert.equal(escrowLock.isPositive, false);

    const escrowRelease = formatTransactionBadge('ESCROW_RELEASE');
    assert.equal(escrowRelease.label, 'Nhận giải ngân ký quỹ');
    assert.equal(escrowRelease.isPositive, true);

    const donation = formatTransactionBadge('DONATION');
    assert.equal(donation.label, 'Ủng hộ (Donation)');
    assert.equal(donation.isPositive, true);

    const unknown = formatTransactionBadge('CUSTOM_FLOW_XYZ');
    assert.equal(unknown.label, 'CUSTOM_FLOW_XYZ');
    assert.equal(unknown.isPositive, false);
  });

  it('Scenario 12: shouldDisplayRecentTransactions returns false when list is empty, null, or undefined', () => {
    assert.equal(shouldDisplayRecentTransactions(null), false);
    assert.equal(shouldDisplayRecentTransactions(undefined), false);
    assert.equal(shouldDisplayRecentTransactions([]), false);
  });

  it('Scenario 13: shouldDisplayRecentTransactions returns true when real transactions exist', () => {
    const sample = [{ id: 1, amount: 50000, type: 'PODCAST' }];
    assert.equal(shouldDisplayRecentTransactions(sample), true);
  });

  it('Scenario 14: getRecentTransactionTitle maps transaction types to user-friendly titles correctly', () => {
    assert.equal(getRecentTransactionTitle('PODCAST_REVENUE', 120000), 'Doanh thu từ podcast');
    assert.equal(getRecentTransactionTitle('VIDEO_STREAM', 250000), 'Doanh thu từ video');
    assert.equal(getRecentTransactionTitle('TOPUP', 100000), 'Nạp tiền vào ví');
    assert.equal(getRecentTransactionTitle('WITHDRAW', -500000), 'Rút tiền về ngân hàng');
    assert.equal(getRecentTransactionTitle('DONATION', 50000), 'Ủng hộ từ thính giả');
    assert.equal(getRecentTransactionTitle('UNKNOWN_REVENUE', 80000), 'Doanh thu nội dung');
    assert.equal(getRecentTransactionTitle('UNKNOWN_FEE', -20000), 'Giao dịch biến động');
  });
});
