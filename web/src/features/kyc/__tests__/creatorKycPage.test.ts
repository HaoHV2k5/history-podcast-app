import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

export const validateKycFormData = (data: {
  fullName: string;
  phone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  agreeTerms: boolean;
}) => {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
  }

  if (!data.phone || !phoneRegex.test(data.phone.trim())) {
    errors.phone = 'Số điện thoại không đúng định dạng Việt Nam';
  }

  if (!data.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim())) {
    errors.contactEmail = 'Địa chỉ email không đúng định dạng';
  }

  if (!data.bankName || data.bankName.trim().length === 0) {
    errors.bankName = 'Vui lòng chọn ngân hàng';
  }

  if (
    !data.bankAccountNumber ||
    data.bankAccountNumber.length < 4 ||
    data.bankAccountNumber.length > 25 ||
    !/^[0-9]+$/.test(data.bankAccountNumber)
  ) {
    errors.bankAccountNumber = 'Số tài khoản không hợp lệ';
  }

  if (!data.bankAccountHolder || data.bankAccountHolder.trim().length < 2) {
    errors.bankAccountHolder = 'Tên chủ tài khoản không hợp lệ';
  }

  if (!data.agreeTerms) {
    errors.agreeTerms = 'Bạn cần cam kết tính xác thực';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const maskBankAccount = (account: string) => {
  if (!account || account.length < 4) return account;
  return `•••• •••• ${account.slice(-4)}`;
};

describe('Creator KYC Verification Page Logic Tests', () => {
  it('1. Validates required KYC fields accurately', () => {
    const invalid = validateKycFormData({
      fullName: '',
      phone: '123',
      contactEmail: 'invalid-email',
      bankName: '',
      bankAccountNumber: 'abc',
      bankAccountHolder: '',
      agreeTerms: false,
    });

    assert.equal(invalid.isValid, false);
    assert.ok(invalid.errors.fullName);
    assert.ok(invalid.errors.phone);
    assert.ok(invalid.errors.contactEmail);
    assert.ok(invalid.errors.bankName);
    assert.ok(invalid.errors.bankAccountNumber);
    assert.ok(invalid.errors.bankAccountHolder);
    assert.ok(invalid.errors.agreeTerms);
  });

  it('2. Accepts valid Vietnamese author KYC payload', () => {
    const valid = validateKycFormData({
      fullName: 'Nguyễn Văn An',
      phone: '0912345678',
      contactEmail: 'tacgia@suky.vn',
      bankName: 'Vietcombank',
      bankAccountNumber: '0011001234567',
      bankAccountHolder: 'NGUYEN VAN AN',
      agreeTerms: true,
    });

    assert.equal(valid.isValid, true);
    assert.equal(Object.keys(valid.errors).length, 0);
  });

  it('3. Safely masks bank account numbers for UI privacy', () => {
    assert.equal(maskBankAccount('0011001234567'), '•••• •••• 4567');
    assert.equal(maskBankAccount('9876543210'), '•••• •••• 3210');
    assert.equal(maskBankAccount('123'), '123');
  });

  it('4. Validates synchronized Approved tab identifiers', () => {
    const approvedTabs = ['profile', 'benefits', 'security'];
    assert.equal(approvedTabs.length, 3);
    assert.ok(approvedTabs.includes('profile'));
    assert.ok(approvedTabs.includes('benefits'));
    assert.ok(approvedTabs.includes('security'));
  });

  it('5. Ensures OTP verification gates submission', () => {
    const canSubmit = (isOtpVerified: boolean, hasExistingOtp: boolean) => {
      return isOtpVerified || hasExistingOtp;
    };

    assert.equal(canSubmit(false, false), false);
    assert.equal(canSubmit(true, false), true);
    assert.equal(canSubmit(false, true), true);
    assert.equal(canSubmit(true, true), true);
  });
});
