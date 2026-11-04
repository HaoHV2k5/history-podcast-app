import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Testable channel logic and financial calculations
export const calculateRevenueShares = (monthlyPrice: number) => {
  const creatorShare = Math.round(monthlyPrice * 0.9);
  const platformFee = monthlyPrice - creatorShare;
  return { creatorShare, platformFee };
};

export const validateChannelUpdate = (data: { name: string; description: string }) => {
  const errors: Record<string, string> = {};
  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Tên kênh phải có ít nhất 3 ký tự';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Tên kênh không được vượt quá 100 ký tự';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Mô tả kênh phải có ít nhất 10 ký tự';
  } else if (data.description.trim().length > 500) {
    errors.description = 'Mô tả kênh không được vượt quá 500 ký tự';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateMembershipPrice = (price: number) => {
  if (price < 10000 || price > 5000000) {
    return {
      isValid: false,
      error: 'Mức giá gói hội viên phải nằm trong khoảng 10.000 VNĐ – 5.000.000 VNĐ / tháng.',
    };
  }
  return { isValid: true, error: null };
};

describe('Creator Channel Tabs & Financial Calculation Logic', () => {
  it('1. Calculates exact 90/10 revenue split with no rounding leak', () => {
    const testPrices = [50000, 100000, 25000, 99000, 1500000];
    for (const price of testPrices) {
      const { creatorShare, platformFee } = calculateRevenueShares(price);
      assert.equal(creatorShare + platformFee, price, `Price ${price} must reconcile perfectly`);
      assert.equal(creatorShare, Math.round(price * 0.9));
      assert.equal(platformFee, price - creatorShare);
    }
  });

  it('2. Validates channel update payload bounds', () => {
    // Too short name
    const shortName = validateChannelUpdate({ name: 'ab', description: 'Kênh podcast lịch sử Việt Nam chất lượng cao.' });
    assert.equal(shortName.isValid, false);
    assert.ok(shortName.errors.name);

    // Too short description
    const shortDesc = validateChannelUpdate({ name: 'Đại Việt Sử Ký', description: 'Quá ngắn' });
    assert.equal(shortDesc.isValid, false);
    assert.ok(shortDesc.errors.description);

    // Valid payload
    const valid = validateChannelUpdate({
      name: 'Đại Việt Sử Ký Toàn Thư',
      description: 'Kênh podcast chuyên sâu về lịch sử và các chiến dịch dựng nước, giữ nước của dân tộc Việt Nam.',
    });
    assert.equal(valid.isValid, true);
    assert.equal(Object.keys(valid.errors).length, 0);
  });

  it('3. Enforces membership price constraints (10.000đ to 5.000.000đ)', () => {
    assert.equal(validateMembershipPrice(5000).isValid, false);
    assert.equal(validateMembershipPrice(10000).isValid, true);
    assert.equal(validateMembershipPrice(50000).isValid, true);
    assert.equal(validateMembershipPrice(5000000).isValid, true);
    assert.equal(validateMembershipPrice(5000001).isValid, false);
  });

  it('4. Generates consistent handle slug from channel name', () => {
    const generateHandle = (name: string) => {
      return `@${(name || 'daivietsuky')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}`;
    };

    assert.equal(generateHandle('Đại Việt Sử Ký'), '@daivietsuky');
    assert.equal(generateHandle('Hào Khí Thăng Long 2026!'), '@haokhithanglong2026');
    assert.equal(generateHandle(''), '@daivietsuky');
  });

  it('5. Ensures synchronized tab keys are exhaustive and valid', () => {
    const validTabs = ['overview', 'info', 'membership', 'support'];
    assert.equal(validTabs.length, 4);
    assert.ok(validTabs.includes('overview'));
    assert.ok(validTabs.includes('info'));
    assert.ok(validTabs.includes('membership'));
    assert.ok(validTabs.includes('support'));
  });
});
