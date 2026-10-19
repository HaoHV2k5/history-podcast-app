import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateWithdrawalAmount,
  validateBankAccount,
  formatTransactionBadge,
} from './financeLogic.ts';

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
});
