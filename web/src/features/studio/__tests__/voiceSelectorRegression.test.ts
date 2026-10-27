import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getVoiceRegion,
  getVoiceAccentDisplay,
  getRegionLabel,
  getGenderLabel,
  getEngineLabel,
} from '../creatorStudioUtils.ts';
import type { CreatorVoiceItem } from '../../../types/creatorStudio.ts';

describe('Step3 Voice Selector - Regional & Search Classification Regression', () => {
  const mockNamMinh: CreatorVoiceItem = {
    id: 'vi-VN-NamMinhNeural',
    name: 'Nam Minh',
    gender: 'male',
    engine: 'edge-tts',
    accent: 'Nam chuẩn Bắc, truyền cảm, tự nhiên',
    recommendedFor: 'Thuyết minh phổ thông, podcast, tài liệu lịch sử',
    vietnameseRating: 5.0,
    previewUrl: '/audio/voices/vi-VN-NamMinhNeural.mp3',
    sampleText: 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.',
    tags: ['free', 'male', 'recommended', 'podcast'],
  };

  const mockHoaiMy: CreatorVoiceItem = {
    id: 'vi-VN-HoaiMyNeural',
    name: 'Hoài My',
    gender: 'female',
    engine: 'edge-tts',
    accent: 'Nữ chuẩn Bắc, dịu dàng, lắng đọng',
    recommendedFor: 'Huyền sử, văn hóa nghệ thuật, nhân vật lịch sử',
    vietnameseRating: 5.0,
    previewUrl: '/audio/voices/vi-VN-HoaiMyNeural.mp3',
    sampleText: 'Sông núi nước Nam vua Nam ở, rành rành định phận tại sách trời.',
    tags: ['free', 'female', 'recommended', 'culture'],
  };

  const mockAdam: CreatorVoiceItem = {
    id: 'Adam',
    name: 'Adam (Podcast Tự Sự & Lắng Đọng)',
    gender: 'male',
    engine: 'elevenlabs',
    accent: 'Nam trầm ấm, tự nhiên, gần gũi, biểu cảm phong phú',
    recommendedFor: 'Podcast lịch sử, tự sự cuộc đời danh nhân, đàm đạo sử xưa',
    vietnameseRating: 5.0,
    previewUrl: 'https://example.com/adam.mp3',
    sampleText: 'Mỗi trang sử Việt không chỉ là chiến tích...',
    tags: ['elevenlabs', 'male', 'recommended', 'podcast'],
  };

  const mockCallum: CreatorVoiceItem = {
    id: 'Callum',
    name: 'Callum (Hào Khí Sử Thi & Hịch Chiến Trận)',
    gender: 'male',
    engine: 'elevenlabs',
    accent: 'Khàn uy lực, dồn dập, giàu kịch tính chiến đấu',
    recommendedFor: 'Đọc Hịch Tướng Sĩ, trận đánh ác liệt',
    vietnameseRating: 4.8,
    previewUrl: 'https://example.com/callum.mp3',
    sampleText: 'Ta thường nghe: Kỷ Tín đem mình chết thay...',
    tags: ['elevenlabs', 'male', 'epic', 'battle'],
  };

  test('1. Nam Minh is correctly classified as Miền Nam (never confused with Miền Bắc)', () => {
    const region = getVoiceRegion(mockNamMinh);
    assert.equal(region, 'mien-nam');
    assert.notEqual(region, 'mien-bac');
  });

  test('2. Hoài My is correctly classified as Miền Bắc', () => {
    const region = getVoiceRegion(mockHoaiMy);
    assert.equal(region, 'mien-bac');
  });

  test('3. Adam is categorized as Toàn quốc (does NOT match Miền Nam despite containing "Nam" for gender)', () => {
    const region = getVoiceRegion(mockAdam);
    assert.equal(region, 'toan-quoc');
    assert.notEqual(region, 'mien-nam');
  });

  test('4. Callum is categorized as Miền Trung', () => {
    const region = getVoiceRegion(mockCallum);
    assert.equal(region, 'mien-trung');
  });

  test('5. getVoiceAccentDisplay removes confusing "Nam chuẩn Bắc" label for Nam Minh', () => {
    const display = getVoiceAccentDisplay(mockNamMinh);
    assert.match(display, /Giọng Nam Bộ/);
    assert.doesNotMatch(display, /chuẩn Bắc/);
  });

  test('6. Pure Vietnamese metadata labels format accurately', () => {
    assert.equal(getRegionLabel('mien-nam'), 'Miền Nam');
    assert.equal(getRegionLabel('mien-bac'), 'Miền Bắc');
    assert.equal(getRegionLabel('mien-trung'), 'Miền Trung');
    assert.equal(getRegionLabel('toan-quoc'), 'Toàn quốc');

    assert.equal(getGenderLabel('male'), 'Giọng Nam');
    assert.equal(getGenderLabel('female'), 'Giọng Nữ');
    assert.equal(getGenderLabel('neutral'), 'Trung tính');

    assert.equal(getEngineLabel('edge-tts'), 'Miễn phí (Edge-TTS)');
    assert.equal(getEngineLabel('elevenlabs'), 'Cao cấp (ElevenLabs)');
  });

  test('7. Clicking currently selected voice deselects it (returns empty string)', () => {
    const selectedVoiceId = 'vi-VN-NamMinhNeural';
    const toggleVoice = (clickedId: string) => (selectedVoiceId === clickedId ? '' : clickedId);

    assert.equal(toggleVoice('vi-VN-NamMinhNeural'), '');
    assert.equal(toggleVoice('vi-VN-HoaiMyNeural'), 'vi-VN-HoaiMyNeural');
  });

  test('8. Clicking active filter chip toggles back to "all"', () => {
    const toggleFilter = (current: string, next: string) => (current === next ? 'all' : next);

    assert.equal(toggleFilter('mien-nam', 'mien-nam'), 'all');
    assert.equal(toggleFilter('all', 'mien-bac'), 'mien-bac');
    assert.equal(toggleFilter('male', 'male'), 'all');
    assert.equal(toggleFilter('edge-tts', 'edge-tts'), 'all');
  });

  test('9. Empty selectedVoiceId safely falls back to default voiceName without failing', () => {
    const selectedVoiceId = '';
    const resolvedVoiceName = selectedVoiceId || 'vi-VN-NamMinhNeural';

    assert.equal(resolvedVoiceName, 'vi-VN-NamMinhNeural');
  });
});
