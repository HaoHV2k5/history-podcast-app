import {
  LivestreamSession,
  LivestreamTokenResponse,
  LivestreamChatMessage,
  LIVESTREAM_ERROR_CODES,
  LivestreamApiError,
  CreateLivestreamRequest,
} from '../../types/livestream';
import { PageResponse, ApiResponse } from '../../types/api';

export { LivestreamApiError };

/**
 * Kiểm tra xem token nhận về có đủ quyền phát sóng PUBLISHER hay không.
 */
export function validatePublisherRole(
  tokenData: Pick<LivestreamTokenResponse, 'role'> | null | undefined
): { valid: boolean; reason?: string } {
  if (!tokenData || !tokenData.role) {
    return { valid: false, reason: 'Không tìm thấy thông tin vai trò kết nối' };
  }
  const normalizedRole = tokenData.role.trim().toUpperCase();
  if (normalizedRole !== 'PUBLISHER') {
    return {
      valid: false,
      reason: `Vai trò "${tokenData.role}" không có quyền phát sóng. Chỉ tài khoản chủ kênh với quyền PUBLISHER mới được phát video.`,
    };
  }
  return { valid: true };
}

/**
 * Kiểm tra tính đầy đủ của thông tin xác thực kết nối Agora RTC
 */
export function validateRtcCredentials(
  tokenData: Partial<LivestreamTokenResponse> | null | undefined
): { valid: boolean; missingFields: string[] } {
  const missing: string[] = [];
  if (!tokenData) {
    return { valid: false, missingFields: ['appId', 'token', 'agoraChannelName', 'uid'] };
  }

  if (!tokenData.appId || !tokenData.appId.trim()) missing.push('appId');
  if (!tokenData.token || !tokenData.token.trim()) missing.push('token');
  if (!tokenData.agoraChannelName || !tokenData.agoraChannelName.trim())
    missing.push('agoraChannelName');
  if (tokenData.uid === undefined || tokenData.uid === null || isNaN(tokenData.uid))
    missing.push('uid');

  return {
    valid: missing.length === 0,
    missingFields: missing,
  };
}

/**
 * Nhận diện xem Token trả về từ backend là Token thật hay Token giả lập (Mock Token)
 * Dựa trên định dạng do AgoraTokenUtil.java sinh ra khi chưa cấu hình Agora App ID
 */
export function isMockToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return (
    trimmed.startsWith('mock_agora_token_') ||
    trimmed.startsWith('agora_token_fallback_') ||
    trimmed.includes('_mock_')
  );
}

/**
 * Tính toán con trỏ thời gian (cursor) tiếp theo cho cơ chế polling tin nhắn chat
 */
export function calculateNextChatCursor(
  currentCursor: number,
  incomingMessages: LivestreamChatMessage[] | null | undefined
): number {
  const baseCursor = Math.max(0, currentCursor);
  if (!incomingMessages || incomingMessages.length === 0) {
    return baseCursor;
  }
  let maxTimestamp = baseCursor;
  for (const msg of incomingMessages) {
    if (typeof msg.timestamp === 'number' && msg.timestamp > maxTimestamp) {
      maxTimestamp = msg.timestamp;
    }
  }
  return maxTimestamp;
}

/**
 * Hợp nhất, khử trùng lặp và sắp xếp danh sách tin nhắn Live Chat theo thứ tự thời gian tăng dần
 * Giới hạn tối đa số tin nhắn lưu trong bộ nhớ (mặc định 200 mục khớp với giới hạn backend)
 */
export function deduplicateAndSortChatMessages(
  existingMessages: LivestreamChatMessage[] = [],
  incomingMessages: LivestreamChatMessage[] = [],
  maxLimit: number = 200
): LivestreamChatMessage[] {
  const messageMap = new Map<string, LivestreamChatMessage>();

  // 1. Nạp tin nhắn hiện tại
  for (const msg of existingMessages) {
    if (msg && msg.id) {
      messageMap.set(msg.id, msg);
    }
  }

  // 2. Nạp tin nhắn mới (ghi đè nếu trùng id)
  for (const msg of incomingMessages) {
    if (msg && msg.id) {
      messageMap.set(msg.id, msg);
    }
  }

  // 3. Chuyển sang mảng và sắp xếp theo timestamp tăng dần
  const sorted = Array.from(messageMap.values()).sort((a, b) => {
    const diff = (a.timestamp || 0) - (b.timestamp || 0);
    if (diff !== 0) return diff;
    return (a.id || '').localeCompare(b.id || '');
  });

  // 4. Giữ lại tối đa maxLimit tin nhắn mới nhất
  if (sorted.length > maxLimit) {
    return sorted.slice(sorted.length - maxLimit);
  }

  return sorted;
}

/**
 * Diễn giải mã lỗi nghiệp vụ thành thông báo thân thiện với người dùng
 */
export function interpretLivestreamError(
  errorCode?: string | null,
  defaultMessage: string = 'Đã xảy ra lỗi với phiên Livestream'
): string {
  if (!errorCode) return defaultMessage;

  switch (errorCode) {
    case LIVESTREAM_ERROR_CODES.NOT_FOUND:
      return 'Không tìm thấy phiên livestream này trên hệ thống.';
    case LIVESTREAM_ERROR_CODES.ALREADY_ENDED:
      return 'Phiên livestream này đã kết thúc.';
    case LIVESTREAM_ERROR_CODES.MEMBER_REQUIRED:
      return 'Phiên phát sóng này độc quyền dành riêng cho Hội viên kênh VIP.';
    case LIVESTREAM_ERROR_CODES.FORBIDDEN_ACCESS:
      return 'Bạn không có quyền thực hiện thao tác trên phiên livestream này.';
    case LIVESTREAM_ERROR_CODES.CHANNEL_NOT_FOUND:
      return 'Không tìm thấy kênh phát sóng.';
    case LIVESTREAM_ERROR_CODES.USER_NOT_FOUND:
      return 'Không tìm thấy thông tin tài khoản người dùng.';
    default:
      return defaultMessage;
  }
}

/**
 * Kiểm tra xem Creator hiện tại có quyền điều hành (bắt đầu/kết thúc) phòng live hay không
 */
export function canManageLivestream(
  session: Pick<LivestreamSession, 'creatorId' | 'status'> | null | undefined,
  currentUserId: number | null | undefined
): boolean {
  if (!session || currentUserId === null || currentUserId === undefined) {
    return false;
  }
  return session.creatorId === currentUserId && session.status === 'LIVE';
}

/**
 * Trích xuất an toàn danh sách phiên livestream từ phản hồi backend (tương thích cả items và content)
 */
export function normalizeLivestreamList(
  response:
    | ApiResponse<PageResponse<LivestreamSession>>
    | PageResponse<LivestreamSession>
    | LivestreamSession[]
    | unknown
): LivestreamSession[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  const data = (response as ApiResponse<PageResponse<LivestreamSession>>).data ?? response;
  if (!data || typeof data !== 'object') return [];

  const page = data as Partial<PageResponse<LivestreamSession>>;
  if (Array.isArray(page.items)) return page.items;
  if (Array.isArray(page.content)) return page.content;

  return [];
}

/**
 * Kiểm tra hợp lệ dữ liệu biểu mẫu khởi tạo phiên livestream
 */
export function validateCreateLivestreamInput(
  input: Partial<CreateLivestreamRequest> | null | undefined
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input) {
    errors.channelId = 'Vui lòng chọn hoặc thiết lập kênh phát sóng';
    errors.title = 'Tiêu đề livestream không được để trống';
    return { valid: false, errors };
  }

  // 1. Kiểm tra channelId
  if (!input.channelId || typeof input.channelId !== 'number' || input.channelId <= 0) {
    errors.channelId = 'Vui lòng chọn kênh phát sóng hợp lệ';
  }

  // 2. Kiểm tra title
  const title = (input.title || '').trim();
  if (!title) {
    errors.title = 'Tiêu đề livestream không được để trống';
  } else if (title.length < 3) {
    errors.title = 'Tiêu đề livestream phải có ít nhất 3 ký tự';
  } else if (title.length > 150) {
    errors.title = 'Tiêu đề livestream không được vượt quá 150 ký tự';
  }

  // 3. Kiểm tra description (tùy chọn)
  if (input.description && input.description.length > 1000) {
    errors.description = 'Mô tả không được vượt quá 1000 ký tự';
  }

  // 4. Kiểm tra thumbnailUrl (tùy chọn)
  if (input.thumbnailUrl && input.thumbnailUrl.trim()) {
    const url = input.thumbnailUrl.trim();
    const isValidUrl =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/');
    if (!isValidUrl) {
      errors.thumbnailUrl = 'Đường dẫn ảnh thu nhỏ không hợp lệ (cần bắt đầu bằng http://, https:// hoặc /)';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Lọc danh sách phiên livestream theo trạng thái tab giao diện
 */
export function filterLivestreamsByStatus(
  sessions: LivestreamSession[] | null | undefined,
  statusFilter: 'ALL' | 'LIVE' | 'ENDED'
): LivestreamSession[] {
  if (!sessions || !Array.isArray(sessions)) return [];
  if (statusFilter === 'ALL') return sessions;
  return sessions.filter((s) => s && s.status === statusFilter);
}

/**
 * Định dạng số lượng người xem theo chuẩn hiển thị thân thiện
 */
export function formatLivestreamViewerCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count) || count < 0) {
    return '0';
  }
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toLocaleString('vi-VN');
}

/**
 * Xác thực tổng thể phản hồi Token kết nối dành riêng cho Host/Publisher
 * Kiểm tra role = PUBLISHER, đầy đủ trường kết nối và chặn Mock Token trước khi join
 */
export function validatePublisherTokenResponse(
  tokenData: Partial<LivestreamTokenResponse> | null | undefined
): { valid: boolean; isMock: boolean; reason?: string } {
  if (!tokenData) {
    return { valid: false, isMock: false, reason: 'Không nhận được dữ liệu xác thực từ máy chủ' };
  }

  // 1. Kiểm tra vai trò PUBLISHER
  const roleCheck = validatePublisherRole(tokenData as Pick<LivestreamTokenResponse, 'role'>);
  if (!roleCheck.valid) {
    return { valid: false, isMock: false, reason: roleCheck.reason };
  }

  // 2. Kiểm tra tính đầy đủ của trường kết nối
  const rtcCheck = validateRtcCredentials(tokenData);
  if (!rtcCheck.valid) {
    return {
      valid: false,
      isMock: false,
      reason: `Thông tin kết nối Agora không đầy đủ. Thiếu: ${rtcCheck.missingFields.join(', ')}`,
    };
  }

  // 3. Kiểm tra mock token
  const mock = isMockToken(tokenData.token);
  if (mock) {
    return {
      valid: false,
      isMock: true,
      reason:
        'Hệ thống Backend đang trả về Mock Token (chưa cấu hình Agora App ID/Certificate trên máy chủ). Không thể kết nối tới máy chủ Agora thật.',
    };
  }

  return { valid: true, isMock: false };
}

/**
 * Diễn giải lỗi phần cứng thiết bị (WebRTC media devices) sang tiếng Việt dễ hiểu
 */
export function interpretDeviceError(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi khi truy cập thiết bị ghi hình / thu âm.';

  const errName = (error as { name?: string })?.name || '';
  const errMsg = (error as { message?: string })?.message || '';

  if (
    errName === 'NotAllowedError' ||
    errName === 'PermissionDeniedError' ||
    errMsg.includes('permission denied')
  ) {
    return 'Quyền truy cập Camera hoặc Microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục.';
  }
  if (
    errName === 'NotFoundError' ||
    errName === 'DevicesNotFoundError' ||
    errMsg.includes('not found')
  ) {
    return 'Không tìm thấy thiết bị Camera hoặc Microphone trên máy tính của bạn.';
  }
  if (
    errName === 'NotReadableError' ||
    errName === 'TrackStartError' ||
    errMsg.includes('already in use')
  ) {
    return 'Camera hoặc Microphone đang bị ứng dụng khác sử dụng (như Zoom, Google Meet...). Vui lòng tắt ứng dụng đó và thử lại.';
  }
  if (errName === 'OverconstrainedError') {
    return 'Thiết bị không đáp ứng cấu hình yêu cầu phân giải hoặc tốc độ khung hình.';
  }
  if (errName === 'TypeError' || errMsg.includes('mediaDevices')) {
    return 'Trình duyệt không hỗ trợ WebRTC hoặc bạn đang truy cập qua kết nối không bảo mật (cần HTTPS hoặc localhost).';
  }

  return errMsg || 'Không thể khởi động thiết bị ghi hình / âm thanh.';
}

/**
 * Kiểm tra điều kiện bắt đầu xem trước thiết bị (Camera / Mic)
 */
export function canStartDevicePreview(state: {
  isPreviewing: boolean;
  isBroadcasting: boolean;
}): boolean {
  return !state.isPreviewing && !state.isBroadcasting;
}

/**
 * Kiểm tra điều kiện bắt đầu phát sóng lên Agora RTC CDN
 */
export function canStartBroadcasting(state: {
  isBroadcasting: boolean;
  isJoining: boolean;
  isPublishing: boolean;
  hasTracks: boolean;
}): boolean {
  return (
    !state.isBroadcasting &&
    !state.isJoining &&
    !state.isPublishing &&
    state.hasTracks
  );
}

/**
 * Kiểm tra điều kiện dừng phát sóng
 */
export function canStopBroadcasting(state: {
  isBroadcasting: boolean;
  isJoining: boolean;
}): boolean {
  return state.isBroadcasting || state.isJoining;
}

/**
 * Định dạng thời lượng phát sóng trực tiếp (HH:MM:SS hoặc MM:SS)
 */
export function formatBroadcastingDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Tính toán con trỏ thời gian có cửa sổ trùng lặp (Overlapping Window) để gửi lên Backend.
 * Giúp khắc phục triệt để khiếm khuyết của bộ lọc nghiêm ngặt "m.getTimestamp() > since" ở máy chủ:
 * Nếu nhiều tin nhắn xuất hiện trong cùng một mili-giây với con trỏ trước đó,
 * việc lùi con trỏ về (cursor - overlapWindowMs) đảm bảo không bỏ sót tin nhắn.
 * Các tin nhắn bị trùng lặp trong khoảng thời gian này sẽ được khử trùng bằng UUID (id).
 */
export function calculateOverlappingPollCursor(
  cursor: number,
  overlapWindowMs: number = 1000
): number {
  if (typeof cursor !== 'number' || isNaN(cursor) || cursor <= 0) {
    return 0;
  }
  const window = Math.max(0, overlapWindowMs);
  return Math.max(0, cursor - window);
}

/**
 * Kiểm tra tính hợp lệ của nội dung tin nhắn Live Chat trước khi gửi.
 * Ngăn chặn tin nhắn rỗng, toàn khoảng trắng hoặc vượt quá giới hạn ký tự.
 */
export function validateChatMessageInput(
  text: string | null | undefined,
  maxLength: number = 500
): { valid: boolean; trimmedText: string; error?: string } {
  if (!text) {
    return { valid: false, trimmedText: '', error: 'Tin nhắn không được để trống' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, trimmedText: '', error: 'Tin nhắn không được để trống' };
  }
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      trimmedText: trimmed,
      error: `Tin nhắn không được vượt quá ${maxLength} ký tự (hiện tại: ${trimmed.length})`,
    };
  }
  return { valid: true, trimmedText: trimmed };
}

/**
 * Định dạng nhãn vai trò hiển thị trên khung chat (Chủ phòng / Thính giả)
 */
export function formatChatRoleBadge(
  role: string | undefined
): { label: string; isCreator: boolean } {
  const normalized = (role || '').trim().toLowerCase();
  if (normalized === 'creator' || normalized === 'host') {
    return { label: 'Chủ phòng', isCreator: true };
  }
  return { label: 'Thính giả', isCreator: false };
}

/**
 * Kiểm tra điều kiện khởi động lại phát sóng (Restart Broadcasting)
 * Chỉ cho phép khi phiên vẫn còn LIVE trên backend, không ở trạng thái ENDED,
 * không đang kết nối hoặc đang phát, và đã có sẵn tracks xem trước (preview).
 */
export function canRestartBroadcasting(state: {
  isBroadcasting: boolean;
  isJoining: boolean;
  hasTracks: boolean;
  isSessionEnded: boolean;
}): boolean {
  return (
    !state.isSessionEnded &&
    !state.isBroadcasting &&
    !state.isJoining &&
    state.hasTracks
  );
}

/**
 * Kiểm tra xem phiên phát sóng có đang ở trạng thái đã kết thúc (ENDED) hay không
 */
export function isSessionEndedStatus(status: string | null | undefined): boolean {
  return (status || '').trim().toUpperCase() === 'ENDED';
}

/**
 * Kiểm tra điều kiện cho phép chuyển đổi thiết bị (Camera / Microphone)
 * Chặn thay đổi thiết bị khi đang trong quá trình kết nối mạng bất đồng bộ
 */
export function canSelectDevice(state: {
  isJoining: boolean;
  isPublishing: boolean;
  isStoppingBroadcast?: boolean;
}): boolean {
  return !state.isJoining && !state.isPublishing && !state.isStoppingBroadcast;
}

/**
 * Định dạng nhãn hiển thị cho thiết bị phần cứng (Camera / Microphone)
 * Đảm bảo nhãn thân thiện ngay cả khi trình duyệt chưa cấp quyền đọc tên thiết bị
 */
export function formatDeviceLabel(
  device: { deviceId: string; label?: string } | null | undefined,
  type: 'video' | 'audio',
  index: number
): string {
  if (!device) {
    return type === 'video' ? `Camera ${index + 1}` : `Microphone ${index + 1}`;
  }
  if (device.label && device.label.trim()) {
    return device.label.trim();
  }
  const shortId = device.deviceId ? ` (${device.deviceId.slice(0, 6)}...)` : '';
  return type === 'video'
    ? `Camera ${index + 1}${shortId}`
    : `Microphone ${index + 1}${shortId}`;
}

/**
 * Xác thực tính hợp lệ trước khi thực hiện hành động kết thúc phiên livestream (End Session)
 * Kiểm tra quyền sở hữu Creator và trạng thái phiên hiện hành
 */
export function validateEndSessionTransition(
  session: Pick<LivestreamSession, 'status' | 'creatorId'> | null | undefined,
  currentUserId: number | null | undefined
): { canEnd: boolean; reason?: string } {
  if (!session) {
    return { canEnd: false, reason: 'Không tìm thấy thông tin phiên phát sóng.' };
  }
  if (session.status === 'ENDED') {
    return { canEnd: false, reason: 'Phiên phát sóng này đã kết thúc trước đó.' };
  }
  if (session.status !== 'LIVE') {
    return {
      canEnd: false,
      reason: `Không thể kết thúc phiên ở trạng thái "${session.status}".`,
    };
  }
  if (
    currentUserId !== null &&
    currentUserId !== undefined &&
    session.creatorId !== currentUserId
  ) {
    return {
      canEnd: false,
      reason: 'Chỉ Creator sở hữu phòng phát sóng mới có quyền kết thúc phiên.',
    };
  }
  return { canEnd: true };
}
