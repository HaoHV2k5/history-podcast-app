export interface CanonicalSeriesItem {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  itemCount: number;
  totalDurationSeconds: number;
  status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT';
  category: 'ALL' | 'TRIEU_LY' | 'TRIEU_TRAN' | 'CHIEN_TRANH' | 'NHAN_VAT' | 'VAN_HOA' | 'KHAC';
  historicalEra: string;
  format: string;
  tags: Array<{
    label: string;
    variant: 'rose' | 'amber' | 'stone' | 'sky';
    iconName?: string;
  }>;
  listenCount: number;
  likeCount: number;
  featuredTrackTitle: string;
  authorOrTopic: string;
  audioDurationSeconds: number;
  audioProgressSeconds: number;
  createdAt: string;
}

export const CANONICAL_SERIES_LIST: CanonicalSeriesItem[] = [
  {
    id: 101,
    title: 'Triều Lý: Khởi nguồn Đại Việt',
    description:
      'Từ dời đô Thăng Long đến những cải cách mở nền cho một quốc gia độc lập, tự chủ.',
    coverUrl: '/assets/studio/topic-thang-long.png',
    itemCount: 8,
    totalDurationSeconds: 12840,
    status: 'PUBLISHED',
    category: 'TRIEU_LY',
    historicalEra: 'TRIEU_LY',
    format: 'PODCAST_VIDEO',
    tags: [
      { label: 'Triều Lý', variant: 'rose', iconName: 'Landmark' },
      { label: 'Chính trị', variant: 'stone', iconName: 'Scale' },
    ],
    listenCount: 12400,
    likeCount: 892,
    featuredTrackTitle: 'Chiếu Dời Đô 1010 và Khát Vọng Thăng Long',
    authorOrTopic: 'Triều Lý • Chính trị',
    audioDurationSeconds: 1695,
    audioProgressSeconds: 754,
    createdAt: '2026-10-15T08:00:00Z',
  },
  {
    id: 102,
    title: 'Triều Trần: Hào khí Đông A',
    description:
      'Hành trình ba lần đánh bại quân Nguyên Mông, khắc họa tinh thần bất khuất của dân tộc.',
    coverUrl: '/assets/studio/topic-dien-hong.png',
    itemCount: 12,
    totalDurationSeconds: 19400,
    status: 'PUBLISHED',
    category: 'TRIEU_TRAN',
    historicalEra: 'TRIEU_TRAN',
    format: 'PODCAST_VIDEO',
    tags: [
      { label: 'Triều Trần', variant: 'amber', iconName: 'Shield' },
      { label: 'Chiến tranh', variant: 'stone', iconName: 'Swords' },
    ],
    listenCount: 28700,
    likeCount: 1200,
    featuredTrackTitle: 'Hịch Tướng Sĩ và Hội Nghị Diên Hồng 1284',
    authorOrTopic: 'Triều Trần • Chiến tranh',
    audioDurationSeconds: 2140,
    audioProgressSeconds: 890,
    createdAt: '2026-10-18T10:30:00Z',
  },
  {
    id: 103,
    title: 'Những trận thủy chiến lừng danh',
    description:
      'Bạch Đằng, Như Nguyệt và những chiến công hiển hách trên sông nước.',
    coverUrl: '/assets/studio/topic-bach-dang-938.png',
    itemCount: 6,
    totalDurationSeconds: 9800,
    status: 'PUBLISHED',
    category: 'CHIEN_TRANH',
    historicalEra: 'CHIEN_TRANH',
    format: 'PODCAST_VIDEO',
    tags: [
      { label: 'Chiến tranh', variant: 'amber', iconName: 'Swords' },
      { label: 'Quân sự', variant: 'stone', iconName: 'Shield' },
    ],
    listenCount: 18900,
    likeCount: 965,
    featuredTrackTitle: 'Đại Chiến Bạch Đằng 938: Tiếng Sóng Vang Dội',
    authorOrTopic: 'Triệu Ngô • Chiến tranh',
    audioDurationSeconds: 1695, // 28:15
    audioProgressSeconds: 754, // 12:34
    createdAt: '2026-10-20T14:15:00Z',
  },
  {
    id: 104,
    title: 'Các vị vua tiêu biểu',
    description:
      'Hồ sơ chân dung những vị vua có tầm ảnh hưởng lớn trong lịch sử Việt Nam thời Lý – Trần.',
    coverUrl: '/assets/studio/topic-lam-son.png',
    itemCount: 4,
    totalDurationSeconds: 6720,
    status: 'PUBLISHED',
    category: 'NHAN_VAT',
    historicalEra: 'TRIEU_LY',
    format: 'WHITEBOARD',
    tags: [
      { label: 'Nhân vật', variant: 'rose', iconName: 'User' },
      { label: 'Lịch sử', variant: 'stone', iconName: 'BookOpen' },
    ],
    listenCount: 15200,
    likeCount: 740,
    featuredTrackTitle: 'Lý Thái Tổ: Vị Vua Khai Sáng Vương Triều Lý',
    authorOrTopic: 'Nhân vật • Vương triều',
    audioDurationSeconds: 1420,
    audioProgressSeconds: 520,
    createdAt: '2026-10-22T09:00:00Z',
  },
  {
    id: 105,
    title: 'Văn hóa & Đời sống thời Lý – Trần',
    description:
      'Khám phá đời sống dân gian, giáo dục, tôn giáo và những giá trị văn hóa đặc sắc.',
    coverUrl: '/assets/studio/topic-nhu-nguyet.png',
    itemCount: 3,
    totalDurationSeconds: 5200,
    status: 'PUBLISHED',
    category: 'VAN_HOA',
    historicalEra: 'TRIEU_TRAN',
    format: 'PODCAST_VIDEO',
    tags: [
      { label: 'Văn hóa', variant: 'sky', iconName: 'Sparkles' },
      { label: 'Đời sống', variant: 'stone', iconName: 'Landmark' },
    ],
    listenCount: 9800,
    likeCount: 512,
    featuredTrackTitle: 'Phật Giáo Thời Trần & Tinh Thần Trúc Lâm Yên Tử',
    authorOrTopic: 'Văn hóa • Tôn giáo',
    audioDurationSeconds: 1240,
    audioProgressSeconds: 310,
    createdAt: '2026-10-23T11:45:00Z',
  },
  {
    id: 106,
    title: 'Di sản & Kiến trúc cổ',
    description:
      'Những công trình, di sản và kiến trúc tiêu biểu còn lại từ thời Lý – Trần.',
    coverUrl: '/assets/studio/topic-thang-long-banner.png',
    itemCount: 2,
    totalDurationSeconds: 3600,
    status: 'PUBLISHED',
    category: 'KHAC',
    historicalEra: 'KHAC',
    format: 'PODCAST_VIDEO',
    tags: [
      { label: 'Kiến trúc', variant: 'amber', iconName: 'Landmark' },
      { label: 'Di sản', variant: 'stone', iconName: 'Folder' },
    ],
    listenCount: 8300,
    likeCount: 430,
    featuredTrackTitle: 'Chùa Một Cột và Tháp Phổ Minh: Dấu Ấn Nghìn Năm',
    authorOrTopic: 'Di sản • Kiến trúc',
    audioDurationSeconds: 1080,
    audioProgressSeconds: 420,
    createdAt: '2026-10-25T16:00:00Z',
  },
];
