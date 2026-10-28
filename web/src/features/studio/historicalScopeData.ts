export interface HistoricalTopicItem {
  id: string;
  dynasty: 'ly' | 'tran';
  dynastyName: string;
  title: string;
  shortTitle?: string;
  cardSubtitle?: string;
  thumbnailUrl?: string;
  figure: string;
  desc: string;
  era: string;
  sourceBook: string;
  sourceVolume: string;
  excerpt: string;
  suggestedDuration: number;
  tags: string[];
}

export const HISTORICAL_SCOPE_SUGGESTIONS: HistoricalTopicItem[] = [
  {
    id: 'doi-do-1010',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Đại Lễ Dời Đô Năm 1010 (Lý Thái Tổ)',
    shortTitle: 'Đại Lễ Dời Đô Năm 1010',
    cardSubtitle: 'Lý Thái Tổ (1009 – 1225)',
    thumbnailUrl: '/assets/studio/topic-thang-long.png',
    figure: 'Vua Lý Thái Tổ (Lý Công Uẩn)',
    desc: 'Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ cố đô Hoa Lư ra thành Đại La. Thuyền ngự vừa đỗ dưới chân thành thì có rồng vàng bay vút lên trời xanh, nhân đó đổi tên Đại La thành Thăng Long.',
    era: 'Năm Canh Tuất 1010',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển II',
    excerpt: 'Vua thấy thành cũ Đại La ở giữa khu vực trời đất, có thế rồng cuộn hổ ngồi, chính giữa nam bắc đông tây, tiện nghi núi sông sau trước... Muôn vật hết sức tươi tốt phồn thịnh.',
    suggestedDuration: 60,
    tags: ['Chiếu Dời Đô', 'Thăng Long', 'Rồng Vàng', 'Định Đô'],
  },
  {
    id: 'nhu-nguyet-1077',
    dynasty: 'ly',
    dynastyName: 'Triều Lý (1009 – 1225)',
    title: 'Phòng Tuyến Sông Như Nguyệt Năm 1077',
    shortTitle: 'Phòng Tuyến Sông Như Nguyệt Năm 1077',
    cardSubtitle: 'Lý Thường Kiệt (1009 – 1225)',
    thumbnailUrl: '/assets/studio/topic-nhu-nguyet.png',
    figure: 'Thái úy Lý Thường Kiệt',
    desc: 'Thái úy Lý Thường Kiệt lãnh đạo cuộc kháng chiến chống 30 vạn quân Tống xâm lược. Đêm trên sông Như Nguyệt vang vọng bài thơ thần Nam Quốc Sơn Hà, khẳng định chủ quyền độc lập của giang sơn Đại Việt.',
    era: 'Năm Đinh Tỵ 1077',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển III',
    excerpt: 'Nam quốc sơn hà Nam đế cư / Tiệt nhiên định phận tại thiên thư / Như hà nghịch lỗ lai xâm phạm / Nhữ đẳng hành khan thủ bại hư.',
    suggestedDuration: 60,
    tags: ['Sông Như Nguyệt', 'Nam Quốc Sơn Hà', 'Kháng Tống', 'Thơ Thần'],
  },
  {
    id: 'bach-dang-1288',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Đại Thắng Bạch Đằng Năm 1288 (Trần Quốc Tuấn)',
    shortTitle: 'Đại Thắng Bạch Đằng Năm 1288',
    cardSubtitle: 'Trần Quốc Tuấn (1225 – 1400)',
    thumbnailUrl: '/assets/studio/topic-bach-dang.png',
    figure: 'Hưng Đạo Đại Vương Trần Quốc Tuấn',
    desc: 'Trận thủy chiến cọc ngầm lịch sử trên sông Bạch Đằng, Hưng Đạo Vương đón thủy triều rút, đại phá thủy binh Mông - Nguyên do Ô Mã Nhi chỉ huy, bắt sống tướng giặc, giữ vững non sông Đại Việt.',
    era: 'Tháng 3 năm Mậu Tý 1288',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển V',
    excerpt: 'Hưng Đạo Vương đón đánh quân Nguyên, giả cách thua chạy. Quân giặc đuổi theo, thuyền giặc xô vào cọc nhọn bị vỡ đắm... Bắt sống Ô Mã Nhi, Phàn Tiếp dâng lên Thượng hoàng.',
    suggestedDuration: 60,
    tags: ['Trận Bạch Đằng', 'Cọc Ngầm', 'Ô Mã Nhi', 'Thủy Chiến'],
  },
  {
    id: 'dien-hong-1285',
    dynasty: 'tran',
    dynastyName: 'Triều Trần (1225 – 1400)',
    title: 'Hội Nghị Diên Hồng & Hịch Tướng Sĩ (1285)',
    shortTitle: 'Hội Nghị Diên Hồng Năm 1285',
    cardSubtitle: 'Trần Thánh Tông (1225 – 1400)',
    thumbnailUrl: '/assets/studio/topic-dien-hong.png',
    figure: 'Thượng hoàng Trần Thánh Tông & Hưng Đạo Vương',
    desc: 'Trước họa xâm lược của 50 vạn quân Thoát Hoan, triều đình mở hội nghị Diên Hồng hỏi ý muôn dân, muôn người đồng thanh hô Đánh. Tinh thần Sát Thát quật khởi chỉ huy quân dân 3 lần toàn thắng giặc Nguyên.',
    era: 'Năm Ất Dậu 1285',
    sourceBook: 'Đại Việt Sử Ký Toàn Thư',
    sourceVolume: 'Bản Kỷ Toàn Thư • Quyển V',
    excerpt: 'Thượng hoàng triệu các phụ lão trong cả nước về điện Diên Hồng ban yến và hỏi kế đánh giặc. Các phụ lão đều hô to: Đánh! Tiếng vang như sấm dậy trời đất.',
    suggestedDuration: 60,
    tags: ['Hội Nghị Diên Hồng', 'Sát Thát', 'Hịch Tướng Sĩ', 'Ý Đảng Lòng Dân'],
  },
];
