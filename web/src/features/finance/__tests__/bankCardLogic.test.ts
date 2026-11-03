import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBankCardTheme,
  formatCardNumberDisplay,
  formatFullCardNumberDisplay,
  formatCardHolderName,
} from '../bankCardLogic.ts';

describe('Creator Bank Card Logic Test Suite', () => {
  it('1. Correctly resolves Vietcombank theme and CDN logo', () => {
    const theme = resolveBankCardTheme('Vietcombank (Ngân hàng Ngoại thương Việt Nam)');
    assert.equal(theme.code, 'VCB');
    assert.equal(theme.shortName, 'Vietcombank');
    assert.equal(theme.logoUrl, 'https://cdn.vietqr.io/img/VCB.png');
    assert.ok(theme.bgClass.includes('062417'));
  });

  it('2. Correctly resolves Techcombank theme', () => {
    const theme = resolveBankCardTheme('Techcombank');
    assert.equal(theme.code, 'TCB');
    assert.equal(theme.shortName, 'Techcombank');
    assert.equal(theme.logoUrl, 'https://cdn.vietqr.io/img/TCB.png');
    assert.ok(theme.bgClass.includes('181515'));
  });

  it('3. Correctly resolves MB Bank theme', () => {
    const theme = resolveBankCardTheme('MB Bank (Ngân hàng Quân đội)');
    assert.equal(theme.code, 'MB');
    assert.equal(theme.shortName, 'MB Bank');
    assert.equal(theme.logoUrl, 'https://cdn.vietqr.io/img/MB.png');
  });

  it('4. Correctly resolves VietinBank with ICB code', () => {
    const theme = resolveBankCardTheme('VietinBank (Ngân hàng Công thương)');
    assert.equal(theme.code, 'ICB');
    assert.equal(theme.shortName, 'VietinBank');
    assert.equal(theme.logoUrl, 'https://cdn.vietqr.io/img/ICB.png');
  });

  it('5. Correctly handles fallback for unlisted or custom bank', () => {
    const theme = resolveBankCardTheme('Ngân hàng Quốc Tế VIB');
    assert.equal(theme.code, 'NGÂN');
    assert.equal(theme.shortName, 'Ngân hàng Quốc Tế VIB');
    assert.equal(theme.logoUrl, undefined);
  });

  it('6. Handles null or undefined bank name safely', () => {
    const theme = resolveBankCardTheme(undefined);
    assert.equal(theme.code, 'BANK');
    assert.equal(theme.shortName, 'Ngân hàng liên kết');
  });

  it('7. Formats card number with secure masking', () => {
    assert.equal(formatCardNumberDisplay('1234567890'), '•••• •••• •••• 7890');
    assert.equal(formatCardNumberDisplay('987654321098'), '•••• •••• •••• 1098');
    assert.equal(formatCardNumberDisplay('8888'), '•••• •••• •••• 8888');
    assert.equal(formatCardNumberDisplay(''), '•••• •••• •••• ••••');
    assert.equal(formatCardNumberDisplay(undefined), '•••• •••• •••• ••••');
  });

  it('8. Formats cardholder name in uppercase', () => {
    assert.equal(formatCardHolderName('huynh van hao'), 'HUYNH VAN HAO');
    assert.equal(formatCardHolderName('  nguyen thi mai  '), 'NGUYEN THI MAI');
    assert.equal(formatCardHolderName(''), 'CHỦ TÀI KHOẢN');
    assert.equal(formatCardHolderName(undefined), 'CHỦ TÀI KHOẢN');
  });

  it('9. Formats full unmasked card number with 4-digit spacing', () => {
    assert.equal(formatFullCardNumberDisplay('9704229212344024'), '9704 2292 1234 4024');
    assert.equal(formatFullCardNumberDisplay('1234567890'), '1234 5678 90');
    assert.equal(formatFullCardNumberDisplay(''), '•••• •••• •••• ••••');
    assert.equal(formatFullCardNumberDisplay(undefined), '•••• •••• •••• ••••');
  });
});
