part of '../../episode.dart';

// Fictional UI fixtures and demonstration policy only.

const episodes = [
  Episode(
    id: 'thang-long',
    title: 'Chuyện kể từ đất Thăng Long',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 1680,
    description: 'Một góc nhìn về ký ức Thăng Long, từ những mái ngói Văn Miếu đến các con phố vẫn lưu dấu chuyện xưa. Dành một khoảng lặng để lắng nghe thành phố qua những lớp thời gian.',
    chapters: [
      Chapter('Bắt đầu từ một tên gọi', 0),
      Chapter('Dưới những mái ngói Văn Miếu', 380),
      Chapter('Ký ức ở lại cùng thành phố', 1120),
    ],
  ),
  Episode(
    id: 'hoi-an',
    title: 'Một thời thương cảng',
    channel: 'Những miền ký ức',
    image: 'assets/mock/images/hoi-an.jpg',
    category: 'Văn hóa',
    seconds: 2160,
    description: 'Theo nhịp bước qua phố Hội, tìm lại những cuộc gặp gỡ và trao đổi đã để lại dấu ấn trong kiến trúc, văn hóa và đời sống của một thương cảng.',
    chapters: [
      Chapter('Bến nước và phố thị', 0),
      Chapter('Những cuộc gặp gỡ', 630),
      Chapter('Điều còn lại hôm nay', 1510),
    ],
  ),
  Episode(
    id: 'ha-noi',
    title: 'Phố cũ, chuyện chưa cũ',
    channel: 'Chuyện người xưa',
    image: 'assets/mock/images/ha-noi.jpg',
    category: 'Con người',
    seconds: 1440,
    description: 'Mỗi tên phố là một gợi mở. Một hành trình qua những nếp sinh hoạt, nghề cũ và câu chuyện đời thường của Hà Nội.',
    chapters: [
      Chapter('Có một nghề trong tên phố', 0),
      Chapter('Những người giữ ký ức', 470),
      Chapter('Kể tiếp chuyện phố', 1010),
    ],
  ),
];

const memberEpisodes = [
  Episode(
    id: 'van-mieu-notes',
    title: 'Sau những trang tư liệu',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 1260,
    membersOnly: true,
    description: 'Một tập bổ sung dành cho hội viên: câu chuyện về cách đặt câu hỏi, tìm nguồn và đọc những dấu tích còn lại. Nội dung mẫu để thử giao diện hội viên.',
    chapters: [
      Chapter('Bắt đầu từ một câu hỏi', 0),
      Chapter('Đọc và đối chiếu', 420),
    ],
  ),
  Episode(
    id: 'hoi-an-notes',
    title: 'Bên kia những mái nhà',
    channel: 'Những miền ký ức',
    image: 'assets/mock/images/hoi-an.jpg',
    category: 'Văn hóa',
    seconds: 1500,
    membersOnly: true,
    description: 'Một cuộc dạo bước chậm hơn qua phố Hội, dành cho những người muốn nghe tiếp. Nội dung mẫu để thử giao diện hội viên.',
    chapters: [
      Chapter('Những nếp nhà', 0),
      Chapter('Điều người ở lại kể', 510),
    ],
  ),
];

const videoEpisodes = [
  Episode(
    id: 'video-demo',
    title: 'Một khung hình, một câu chuyện',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 12,
    isVideo: true,
    mediaAsset: 'assets/mock/video/playback-demo.mp4',
    description: 'Clip kiểm tra video 12 giây, tạo bằng FFmpeg. Hình chuyển động là bảng thử kỹ thuật, không phải phim hoặc tư liệu lịch sử. Dùng để thử phát, tua, tốc độ và toàn màn hình.',
    chapters: [
      Chapter('Bắt đầu clip kiểm tra', 0),
      Chapter('Chuyển động và màu sắc', 6),
    ],
    sources: 'Bảng thử testsrc2 do FFmpeg tạo, không có âm thanh hoặc nội dung lịch sử. Ảnh bìa sử dụng ảnh có sẵn của prototype; xem ASSETS.md.',
  ),
  Episode(
    id: 'video-member-demo',
    title: 'Khung hình dành cho hội viên',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 12,
    isVideo: true,
    membersOnly: true,
    mediaAsset: 'assets/mock/video/playback-demo.mp4',
    description: 'Cùng clip thử kỹ thuật, dùng kiểm tra khóa/mở quyền xem video theo kênh. Không phải nội dung lịch sử đã kiểm duyệt.',
    chapters: [Chapter('Clip hội viên thử', 0)],
  ),
];

const audioEpisodes = [
  Episode(
    id: 'audio-demo',
    title: 'Một khoảng nghe thử',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 24,
    mediaAsset: 'assets/mock/audio/playback-demo.mp3',
    description: 'Audio kỹ thuật 24 giây để thử phát, tạm dừng, tua, tốc độ và danh sách phát. Đây là các nốt tổng hợp nhỏ, không phải giọng kể, nhạc thương mại hoặc tư liệu lịch sử.',
    chapters: [Chapter('Bắt đầu nghe thử', 0), Chapter('Đổi nốt kiểm tra', 12)],
    sources: 'Âm tổng hợp do FFmpeg aevalsrc tạo cục bộ. Không lời nói/voice AI hoặc nội dung lịch sử.',
  ),
  Episode(
    id: 'audio-member-demo',
    title: 'Khoảng nghe dành cho hội viên',
    channel: 'Dọc miền di sản',
    image: 'assets/mock/images/van-mieu.jpg',
    category: 'Việt Nam',
    seconds: 24,
    membersOnly: true,
    mediaAsset: 'assets/mock/audio/playback-demo.mp3',
    description: 'Cùng audio kỹ thuật 24 giây để thử quyền hội viên theo kênh. Không phải podcast có giọng đọc.',
    chapters: [Chapter('Audio hội viên thử', 0)],
  ),
];

const baseChannels = [
  Channel(
    'Dọc miền di sản',
    'D',
    'assets/mock/images/van-mieu.jpg',
    'Đi qua những vùng đất, lắng nghe những lớp ký ức. Kể chuyện lịch sử từ kiến trúc, di sản và đời sống.',
  ),
  Channel(
    'Những miền ký ức',
    'K',
    'assets/mock/images/hoi-an.jpg',
    'Những câu chuyện về nơi chốn và cuộc gặp gỡ. Một góc nhìn gần gũi về văn hóa qua từng thời kỳ.',
  ),
  Channel(
    'Chuyện người xưa',
    'C',
    'assets/mock/images/ha-noi.jpg',
    'Lịch sử qua những con người và điều bình dị còn ở lại. Những câu chuyện để nghe chậm, nghĩ lâu.',
  ),
];

const seedEpisodeLikes = {
  'thang-long': 142,
  'hoi-an': 98,
  'ha-noi': 115,
  'van-mieu-notes': 45,
  'hoi-an-notes': 36,
};

const initialSampleComments = [
  EpisodeComment(
    id: 'cmt-1',
    episodeId: 'thang-long',
    authorName: 'Nguyễn Minh An',
    content: 'Cách dẫn dắt về Văn Miếu rất chậm rãi và sâu sắc. Thích nhất đoạn phân tích về những tấm bia tiến sĩ.',
    timeAgo: '2 giờ trước',
    likes: 14,
  ),
  EpisodeComment(
    id: 'cmt-2',
    episodeId: 'thang-long',
    authorName: 'Lê Trần Hoài',
    content: 'Giọng đọc truyền cảm, tư liệu được trình bày rất tự nhiên không bị nặng tính sách vở.',
    timeAgo: '5 giờ trước',
    likes: 8,
  ),
  EpisodeComment(
    id: 'cmt-3',
    episodeId: 'hoi-an',
    authorName: 'Trần Văn Bình',
    content: 'Nghe tập này lại nhớ những buổi chiều ngồi bên bờ sông Hoài. Góc nhìn lịch sử thương cảng rất thuyết phục.',
    timeAgo: '1 ngày trước',
    likes: 12,
  ),
  EpisodeComment(
    id: 'cmt-4',
    episodeId: 'ha-noi',
    authorName: 'Đặng Thu Hương',
    content: 'Phố cổ qua nếp sinh hoạt của người thợ thủ công thật sự có hồn và ấm áp.',
    timeAgo: '1 ngày trước',
    likes: 9,
  ),
];

const prohibitedCommentWords = [
  'tục tĩu',
  'lừa đảo',
  'chửi thề',
  'phản động',
  'xúc phạm',
  'tuyên truyền sai',
];
