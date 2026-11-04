import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatNumberWithDots,
  parseNumberFromDots,
  validateDepositAmount,
  convertVNDToWords,
  QUICK_DEPOSIT_PRESETS,
  MIN_DEPOSIT_AMOUNT,
  MAX_DEPOSIT_AMOUNT,
} from '../depositLogic.ts';

describe('Wallet VNPay Deposit Logic Test Suite', () => {
  it('1. Formats numbers and raw strings with dot separators correctly', () => {
    assert.equal(formatNumberWithDots(50000), '50.000');
    assert.equal(formatNumberWithDots('50000'), '50.000');
    assert.equal(formatNumberWithDots(100000), '100.000');
    assert.equal(formatNumberWithDots(1000000), '1.000.000');
    assert.equal(formatNumberWithDots(2000000), '2.000.000');
    assert.equal(formatNumberWithDots(50000000), '50.000.000');
    assert.equal(formatNumberWithDots(''), '');
    assert.equal(formatNumberWithDots(null), '');
    assert.equal(formatNumberWithDots(undefined), '');
  });

  it('2. Parses dot-formatted strings back to pure integer numbers', () => {
    assert.equal(parseNumberFromDots('50.000'), 50000);
    assert.equal(parseNumberFromDots('1.000.000'), 1000000);
    assert.equal(parseNumberFromDots('2.000.000 ₫'), 2000000);
    assert.equal(parseNumberFromDots('50000'), 50000);
    assert.equal(parseNumberFromDots(''), 0);
    assert.equal(parseNumberFromDots(null), 0);
    assert.equal(parseNumberFromDots(undefined), 0);
  });

  it('3. Validates minimum, maximum, and multiple constraints', () => {
    // Valid
    assert.equal(validateDepositAmount(50000).valid, true);
    assert.equal(validateDepositAmount(10000).valid, true);
    assert.equal(validateDepositAmount(50000000).valid, true);

    // Below minimum
    const belowMin = validateDepositAmount(9000);
    assert.equal(belowMin.valid, false);
    assert.ok(belowMin.error?.includes('10.000'));

    // Above maximum
    const aboveMax = validateDepositAmount(51000000);
    assert.equal(aboveMax.valid, false);
    assert.ok(aboveMax.error?.includes('50.000.000'));

    // Not multiple of 1000
    const notMultiple = validateDepositAmount(10500);
    assert.equal(notMultiple.valid, false);
    assert.ok(notMultiple.error?.includes('bội số'));

    // Negative or NaN
    assert.equal(validateDepositAmount(0).valid, false);
    assert.equal(validateDepositAmount(-5000).valid, false);
    assert.equal(validateDepositAmount(NaN).valid, false);
  });

  it('4. Converts VND numeric amounts to natural Vietnamese words', () => {
    assert.equal(convertVNDToWords(10000), 'Mười nghìn đồng');
    assert.equal(convertVNDToWords(50000), 'Năm mươi nghìn đồng');
    assert.equal(convertVNDToWords(100000), 'Một trăm nghìn đồng');
    assert.equal(convertVNDToWords(200000), 'Hai trăm nghìn đồng');
    assert.equal(convertVNDToWords(250000), 'Hai trăm năm mươi nghìn đồng');
    assert.equal(convertVNDToWords(500000), 'Năm trăm nghìn đồng');
    assert.equal(convertVNDToWords(1000000), 'Một triệu đồng');
    assert.equal(convertVNDToWords(1500000), 'Một triệu năm trăm nghìn đồng');
    assert.equal(convertVNDToWords(2000000), 'Hai triệu đồng');
    assert.equal(convertVNDToWords(10500000), 'Mười triệu năm trăm nghìn đồng');
    assert.equal(convertVNDToWords(50000000), 'Năm mươi triệu đồng');
    assert.equal(convertVNDToWords(0), '');
  });

  it('5. Verifies quick presets configuration', () => {
    assert.equal(QUICK_DEPOSIT_PRESETS.length, 6);
    assert.equal(QUICK_DEPOSIT_PRESETS[0].value, 50000);
    assert.equal(QUICK_DEPOSIT_PRESETS[0].label, '50.000 ₫');
    assert.equal(QUICK_DEPOSIT_PRESETS[4].value, 1000000);
    assert.equal(QUICK_DEPOSIT_PRESETS[4].label, '1.000.000 ₫');
    assert.equal(QUICK_DEPOSIT_PRESETS[5].value, 2000000);
    assert.equal(QUICK_DEPOSIT_PRESETS[5].label, '2.000.000 ₫');
  });
});

