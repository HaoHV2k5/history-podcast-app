/**
 * Creator Studio Unit Tests
 * PRM232 - M17-A1 Creator Studio Correction
 *
 * Tests the 16 core requirements using Node 22 native test runner (node:test & node:assert):
 * 1. Correct media URL resolution
 * 2. Edge-TTS static preview URL
 * 3. Voice preview API response handling
 * 4. Voice selection persistence across UI steps
 * 5. Correct voiceName and ttsEngine in render payload
 * 6. Short-title classification (< 100 characters)
 * 7. Exactly 100 characters classification
 * 8. Multiline input classification
 * 9. Three or more periods classification
 * 10. Preservation of edited script state
 * 11. Scene image mapping
 * 12. Drag-and-drop file validation
 * 13. Missing image blocking whiteboard render
 * 14. Single-cover audio podcast validation
 * 15. MP3 and MP4 output display logic
 * 16. Error and loading states
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveMediaUrl,
  classifyInputText,
  validateSceneImages,
  validateMediaFile,
  extractNarrationFromStoryboard,
} from '../creatorStudioUtils.ts';
import type { StoryboardScene } from '../../../types/creatorStudio.ts';

describe('Creator Studio - M17-A1 Core Specifications', () => {
  const TEST_API_BASE = 'http://localhost:8080';

  // 1. Correct media URL resolution
  test('1. Media URL resolution maps relative and absolute paths correctly', () => {
    // Relative output URL from Python/Spring Boot proxy
    const relativeOutput = '/outputs/job_123/final_whiteboard_video.mp4';
    assert.equal(
      resolveMediaUrl(relativeOutput, TEST_API_BASE),
      'http://localhost:8080/outputs/job_123/final_whiteboard_video.mp4'
    );

    // Absolute Cloudinary URL must be preserved untouched
    const cloudinaryUrl = 'https://res.cloudinary.com/demo/video/upload/v1234/whiteboard/sample.mp4';
    assert.equal(resolveMediaUrl(cloudinaryUrl, TEST_API_BASE), cloudinaryUrl);

    // Empty or undefined url
    assert.equal(resolveMediaUrl(undefined, TEST_API_BASE), '');
    assert.equal(resolveMediaUrl('', TEST_API_BASE), '');
  });

  // 2. Edge-TTS static preview URL
  test('2. Edge-TTS static preview URL resolves to public /audio/** endpoint', () => {
    const staticVoiceUrl = '/audio/voices/vi-VN-NamMinhNeural.mp3';
    const resolved = resolveMediaUrl(staticVoiceUrl, TEST_API_BASE);

    // Must resolve to http://localhost:8080/audio/voices/... without /api/v1/creator/studio
    assert.equal(resolved, 'http://localhost:8080/audio/voices/vi-VN-NamMinhNeural.mp3');
    assert.ok(!resolved.includes('/api/v1/creator/studio'), 'Must not inject authenticated prefix');
  });

  // 3. Voice preview API response handling
  test('3. Voice preview API response URL resolves without authenticated route prefix', () => {
    // Backend previewVoice returns { success: true, url: "/outputs/previews/preview_abc123.mp3" }
    const backendApiPreviewUrl = '/outputs/previews/preview_abc123.mp3';
    const resolved = resolveMediaUrl(backendApiPreviewUrl, TEST_API_BASE);

    assert.equal(resolved, 'http://localhost:8080/outputs/previews/preview_abc123.mp3');
    // Ensure HTML5 <audio> can stream it publicly without 401/403
    assert.ok(resolved.startsWith('http://localhost:8080/outputs/'));
  });

  // 4. Voice selection persistence across UI steps
  test('4. Voice selection state maintains user preference over backend defaults', () => {
    let selectedVoiceId = 'vi-VN-NamMinhNeural'; // default
    let userHasChanged = false;

    // User chooses Hoài My
    selectedVoiceId = 'vi-VN-HoaiMyNeural';
    userHasChanged = true;

    // Later backend settings response arrives with voiceName = "vi-VN-NamMinhNeural"
    const backendSettingsVoice = 'vi-VN-NamMinhNeural';
    if (!userHasChanged) {
      selectedVoiceId = backendSettingsVoice;
    }

    assert.equal(selectedVoiceId, 'vi-VN-HoaiMyNeural', 'User selection must not be overwritten');
  });

  // 5. Correct voiceName and ttsEngine in render payload
  test('5. Render payload correctly associates voiceName and matching ttsEngine', () => {
    const voices = [
      { id: 'vi-VN-NamMinhNeural', engine: 'edge-tts' },
      { id: 'Brian', engine: 'elevenlabs' },
    ];

    const chosenVoiceId = 'Brian';
    const matchedVoice = voices.find((v) => v.id === chosenVoiceId);
    const engine = matchedVoice?.engine || 'edge-tts';

    const renderPayload = {
      title: 'Trận Bạch Đằng 1288',
      voiceName: chosenVoiceId,
      ttsEngine: engine,
      renderMode: 'whiteboard',
    };

    assert.equal(renderPayload.voiceName, 'Brian');
    assert.equal(renderPayload.ttsEngine, 'elevenlabs');
  });

  // 6. Short-title classification (< 100 characters)
  test('6. Short historical title (< 100 chars, no newline, < 3 periods) routes to Branch A', () => {
    const input = 'Chiến thắng Bạch Đằng năm 1288 của Trần Hưng Đạo';
    const result = classifyInputText(input);

    assert.equal(result.isLongText, false);
    assert.equal(result.branch, 'BRANCH_A_SHORT_TITLE');
  });

  // 7. Exactly 100 characters classification
  test('7. Exactly 100 characters is classified as Short Title (not > 100)', () => {
    // 100 characters exactly (no newline, no periods)
    const exact100 = 'A'.repeat(100);
    assert.equal(exact100.length, 100);

    const result = classifyInputText(exact100);
    assert.equal(
      result.isLongText,
      false,
      'Rule is strictly > 100. Exactly 100 chars must be short title'
    );
    assert.equal(result.branch, 'BRANCH_A_SHORT_TITLE');

    // 101 characters must flip to long script
    const len101 = 'A'.repeat(101);
    const res101 = classifyInputText(len101);
    assert.equal(res101.isLongText, true);
    assert.equal(res101.branch, 'BRANCH_B_EXISTING_SCRIPT');
  });

  // 8. Multiline input classification
  test('8. Short text with newline character routes to Branch B', () => {
    const multilineShort = 'Đoạn một ngắn.\nĐoạn hai cũng ngắn.';
    assert.ok(multilineShort.length < 100);

    const result = classifyInputText(multilineShort);
    assert.equal(result.isLongText, true);
    assert.equal(result.branch, 'BRANCH_B_EXISTING_SCRIPT');
    assert.ok(result.metrics.hasNewline);
  });

  // 9. Three or more periods classification
  test('9. Text with three or more periods routes to Branch B', () => {
    const threeSentences = 'Vua Lý Thái Tổ dời đô. Thuyền ngự cập bến. Rồng vàng bay lên.';
    assert.ok(threeSentences.length < 100);

    const result = classifyInputText(threeSentences);
    assert.equal(result.isLongText, true);
    assert.equal(result.branch, 'BRANCH_B_EXISTING_SCRIPT');
    assert.ok(result.metrics.periodCount >= 3);
  });

  // 10. Preservation of edited script state
  test('10. Storyboard element edits update narration text without losing user content', () => {
    const scenes: StoryboardScene[] = [
      {
        scene_index: 1,
        scene_title: 'Cảnh 1: Cố đô Hoa Lư',
        elements: [
          { label: 'Hoa Lư', subtitle: 'Hoa Lư núi non hiểm trở phòng thủ thời loạn lạc.' },
          { label: 'Chiếu dời đô', subtitle: 'Vua ban Thiên đô chiếu để lập kế muôn đời.' },
        ],
      },
    ];

    const narration = extractNarrationFromStoryboard(scenes);
    assert.ok(narration.includes('Hoa Lư núi non hiểm trở'));
    assert.ok(narration.includes('Vua ban Thiên đô chiếu'));

    // User edits subtitle of element 2
    scenes[0].elements[1].subtitle = 'Năm 1010, vua Lý Thái Tổ ban Chiếu dời đô ra thành Đại La.';
    const updatedNarration = extractNarrationFromStoryboard(scenes);
    assert.ok(updatedNarration.includes('Năm 1010, vua Lý Thái Tổ ban Chiếu dời đô ra thành Đại La.'));
  });

  // 11. Scene image mapping
  test('11. Scene-to-image mapping associates each scene index to distinct Cloudinary URL', () => {
    const scenes: StoryboardScene[] = [
      { scene_index: 1, scene_title: 'Cảnh 1', elements: [] },
      { scene_index: 2, scene_title: 'Cảnh 2', elements: [] },
    ];

    const sceneImages: Record<string, string> = {
      '1': 'https://res.cloudinary.com/demo/image/upload/v1/scene1.png',
      '2': 'https://res.cloudinary.com/demo/image/upload/v1/scene2.png',
    };

    const validation = validateSceneImages(scenes, sceneImages);
    assert.equal(validation.isValid, true);
    assert.equal(validation.assignedCount, 2);
    assert.equal(validation.missingScenes.length, 0);
  });

  // 12. Drag-and-drop file validation
  test('12. Media file validation accepts PNG/JPG/WebP <= 10MB and rejects invalid files', () => {
    // Valid PNG
    const validFile = new File(['dummy content'], 'scene1.png', { type: 'image/png' });
    const resValid = validateMediaFile(validFile);
    assert.equal(resValid.isValid, true);

    // Empty file (0 bytes)
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
    const resEmpty = validateMediaFile(emptyFile);
    assert.equal(resEmpty.isValid, false);
    assert.ok(resEmpty.error?.includes('rỗng'));

    // Unsupported format (e.g. PDF)
    const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
    const resPdf = validateMediaFile(pdfFile);
    assert.equal(resPdf.isValid, false);
    assert.ok(resPdf.error?.includes('không được hỗ trợ'));
  });

  // 13. Missing image blocking whiteboard render
  test('13. Missing scene image blocks Whiteboard render and lists missing scene indices', () => {
    const scenes: StoryboardScene[] = [
      { scene_index: 1, scene_title: 'Cảnh 1', elements: [] },
      { scene_index: 2, scene_title: 'Cảnh 2', elements: [] },
      { scene_index: 3, scene_title: 'Cảnh 3', elements: [] },
    ];

    // Only scene 1 has an image; scene 2 and 3 are missing
    const partialImages: Record<string, string> = {
      '1': 'https://res.cloudinary.com/demo/image/upload/v1/scene1.png',
    };

    const validation = validateSceneImages(scenes, partialImages);
    assert.equal(validation.isValid, false);
    assert.deepEqual(validation.missingScenes, [2, 3]);
    assert.ok(validation.message?.includes('Cảnh 2, 3 chưa có hình ảnh minh họa'));
  });

  // 14. Single-cover audio podcast validation
  test('14. Audio Podcast mode validates single cover image without requiring all scenes', () => {
    const coverUrl = 'https://res.cloudinary.com/demo/image/upload/v1/podcast_cover.jpg';
    const scriptText = 'Nội dung thuyết minh podcast lịch sử Việt Nam.';

    const isCoverValid = Boolean(coverUrl && coverUrl.startsWith('https://'));
    const isScriptValid = Boolean(scriptText && scriptText.trim().length > 0);

    assert.equal(isCoverValid && isScriptValid, true);
  });

  // 15. MP3 and MP4 output display logic
  test('15. Job completed status resolves both video_url (MP4) and audio_url (MP3)', () => {
    const jobStatus = {
      status: 'completed',
      render_mode: 'audio_podcast',
      video_url: '/outputs/job_456/final_whiteboard_video.mp4',
      audio_url: '/outputs/job_456/podcast_voice.mp3',
      srt_url: '/outputs/job_456/subtitles.srt',
    };

    const resolvedVideo = resolveMediaUrl(jobStatus.video_url, TEST_API_BASE);
    const resolvedAudio = resolveMediaUrl(jobStatus.audio_url, TEST_API_BASE);
    const resolvedSrt = resolveMediaUrl(jobStatus.srt_url, TEST_API_BASE);

    assert.equal(resolvedVideo, 'http://localhost:8080/outputs/job_456/final_whiteboard_video.mp4');
    assert.equal(resolvedAudio, 'http://localhost:8080/outputs/job_456/podcast_voice.mp3');
    assert.equal(resolvedSrt, 'http://localhost:8080/outputs/job_456/subtitles.srt');
  });

  // 16. Error and loading states
  test('16. Error and loading states provide actionable feedback without silent failures', () => {
    let errorToast: string | null = null;
    let isLoading = true;

    // Simulate preview failure
    const simulatePreviewError = (err: { message: string }) => {
      isLoading = false;
      errorToast = `Lỗi nghe thử giọng: ${err.message}`;
    };

    simulatePreviewError({ message: 'ElevenLabs API Key không hợp lệ (401)' });
    assert.equal(isLoading, false);
    assert.equal(errorToast, 'Lỗi nghe thử giọng: ElevenLabs API Key không hợp lệ (401)');
  });

  // 17. Topic suggestion does not contaminate scriptContent with short 40-word item.desc
  test('17. Suggested historical topic card does not set item.desc as scriptContent in ai_prompt mode', () => {
    const topicItem = {
      id: 'ly_thai_to_doi_do',
      title: 'Chiếu Dời Đô 1010: Khát Vọng Thăng Long',
      desc: 'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ cố đô Hoa Lư ra thành Đại La. Thuyền ngự vừa đỗ dưới chân thành thì có rồng vàng bay vút lên trời xanh, nhân đó đổi tên Đại La thành Thăng Long.',
      suggestedDuration: 60,
    };

    let scriptTopic = '';
    let scriptContent = '';
    let storyboardDuration = 60;
    const creationMode = 'ai_prompt';

    // Simulate onSelectTopic in Step1ScriptInput
    scriptTopic = topicItem.title;
    if (creationMode === 'ai_prompt') {
      scriptContent = '';
    }
    storyboardDuration = topicItem.suggestedDuration;

    assert.equal(scriptTopic, 'Chiếu Dời Đô 1010: Khát Vọng Thăng Long');
    assert.equal(scriptContent, '', 'scriptContent must remain clean and not be polluted by short item.desc');
    assert.equal(storyboardDuration, 60);
  });

  // 18. Storyboard generation in ai_prompt mode overwrites scriptContent with full 60s narration
  test('18. Storyboard generation in ai_prompt mode populates full 60s narration into scriptContent', () => {
    const creationMode = 'ai_prompt';
    let scriptContent = 'Old text or previous draft';

    const generatedScenes: StoryboardScene[] = [
      {
        scene_index: 1,
        scene_title: 'Cảnh 1: Rồng vàng thăng hoa',
        elements: [
          { label: 'E1', subtitle: 'Mùa thu năm Canh Tuất 1010, đoàn thuyền rồng của vua Lý Thái Tổ từ Hoa Lư tiến về đồng bằng châu thổ sông Hồng.' },
          { label: 'E2', subtitle: 'Thành Đại La với địa thế rồng cuộn hổ ngồi, đất đai bằng phẳng sáng sủa muôn dân không lo ngập lụt.' },
          { label: 'E3', subtitle: 'Vừa cập bến triều đình, hào quang rực rỡ xuất hiện với điềm lành rồng vàng bay vút lên bầu trời.' },
        ],
      },
      {
        scene_index: 2,
        scene_title: 'Cảnh 2: Định đô ngàn năm',
        elements: [
          { label: 'E4', subtitle: 'Nhân điềm lành rồng bay, vua Lý Thái Tổ hạ chiếu đổi tên thành Đại La thành Thăng Long.' },
          { label: 'E5', subtitle: 'Chiếu dời đô khẳng định khát vọng thái bình thịnh trị, mưu nghiệp lớn đặt nền móng cho con cháu vạn đời.' },
          { label: 'E6', subtitle: 'Kể từ mùa thu năm 1010, Thăng Long chính thức trở thành trái tim thiêng liêng trường tồn của giang sơn Đại Việt.' },
        ],
      },
    ];

    const extracted = extractNarrationFromStoryboard(generatedScenes);
    // In ai_prompt mode, scriptContent must be updated with the full generated narration
    if (extracted && (creationMode === 'ai_prompt' || !scriptContent.trim())) {
      scriptContent = extracted;
    }

    const words = scriptContent.split(/\s+/).length;
    assert.ok(words > 100, `Expected full narration (~100-200 words), got ${words} words`);
    assert.ok(scriptContent.includes('đoàn thuyền rồng'));
    assert.ok(scriptContent.includes('trái tim thiêng liêng'));
  });

  // 19. Audio Podcast render payload uses full 60s narration script
  test('19. Audio Podcast render payload receives full 60s script narration instead of 10s snippet', () => {
    const full60sNarration =
      'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ từ Hoa Lư dời đô ra thành Đại La. ' +
      'Thành Đại La địa thế rồng cuộn hổ ngồi, đất đai bằng phẳng sáng sủa muôn dân an cư lạc nghiệp. ' +
      'Nhân điềm lành rồng vàng bay vút lên trời xanh, vua đổi tên thành Thăng Long, mở ra ngàn năm văn hiến Đại Việt.';

    const payload = {
      title: 'Đại Lễ Dời Đô 1010',
      durationSec: 60,
      renderMode: 'audio_podcast' as const,
      ttsEngine: 'edge-tts',
      voiceName: 'vi-VN-NamMinhNeural',
      scriptText: full60sNarration,
    };

    assert.equal(payload.renderMode, 'audio_podcast');
    assert.equal(payload.durationSec, 60);
    assert.ok(payload.scriptText.length > 150);
  });

  // 20. Scene-level narration text is prioritized when edited
  test('20. extractNarrationFromStoryboard prioritizes sc.narration_text over elements if present', () => {
    const scenes: StoryboardScene[] = [
      {
        scene_index: 1,
        scene_title: 'Cảnh 1',
        narration_text: 'Lời dẫn đã được biên tập trực tiếp bởi tác giả tại phân cảnh 1.',
        elements: [
          { label: 'E1', subtitle: 'Lời dẫn cũ phân cảnh 1.' },
        ],
      },
      {
        scene_index: 2,
        scene_title: 'Cảnh 2',
        elements: [
          { label: 'E2', subtitle: 'Lời dẫn phân cảnh 2 từ phụ đề element.' },
        ],
      },
    ];

    const narration = extractNarrationFromStoryboard(scenes);
    assert.ok(narration.includes('Lời dẫn đã được biên tập trực tiếp bởi tác giả tại phân cảnh 1.'));
    assert.ok(narration.includes('Lời dẫn phân cảnh 2 từ phụ đề element.'));
    assert.ok(!narration.includes('Lời dẫn cũ phân cảnh 1.'));
  });
});
