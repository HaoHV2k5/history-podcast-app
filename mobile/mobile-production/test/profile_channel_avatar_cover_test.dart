import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:su_ky_mobile_production/app_state.dart';
import 'package:su_ky_mobile_production/artwork_image.dart';
import 'package:su_ky_mobile_production/audience_pages.dart';
import 'package:su_ky_mobile_production/episode.dart';

void main() {
  group('Profile & Channel Avatar & Cover Tests (Issue 13)', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
      remoteChannels.clear();
      remoteEpisodes.clear();
    });

    testWidgets('ProfileContent prioritizes userAvatarUrl from Backend/Cloudinary over mock artworkReference', (tester) async {
      const cloudinaryAvatarUrl = 'https://res.cloudinary.com/dns0wbaea/image/upload/v1793113438/users/avatars/user7.png';

      final state = AppState(prefs);
      state.isLoggedIn = true;
      state.displayName = 'Nguyễn Quang Tùng';
      state.userEmail = 'phoenix090205@gmail.com';
      state.userAvatarUrl = cloudinaryAvatarUrl;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ProfileContent(
              state: state,
              onChannel: (_) {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find the ArtworkImage for avatar
      final avatarFinder = find.byWidgetPredicate(
        (widget) => widget is ArtworkImage && widget.source == cloudinaryAvatarUrl,
      );
      expect(avatarFinder, findsOneWidget);
    });

    testWidgets('ChannelPage prioritizes Cloudinary cover and avatar from remoteChannels', (tester) async {
      const cloudinaryCover = 'https://res.cloudinary.com/dns0wbaea/image/upload/v1793114034/history-podcast/channels/covers/cover3.png';
      const cloudinaryAvatar = 'https://res.cloudinary.com/dns0wbaea/image/upload/v1793113438/history-podcast/channels/avatars/avatar3.png';

      final remoteChannel = Channel(
        'Đêm Nghe Chuyện Sử',
        'Đ',
        cloudinaryAvatar,
        'Không gian lắng đọng kể về cuộc đời các danh nhân.',
        id: 3,
        coverImage: cloudinaryCover,
      );
      remoteChannels.add(remoteChannel);

      final state = AppState(prefs);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChannelPage(
              channel: Channel('Đêm Nghe Chuyện Sử', 'Đ', '', ''),
              state: state,
              onEpisode: (_) {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify banner cover uses the Cloudinary cover URL
      final coverFinder = find.byWidgetPredicate(
        (widget) => widget is ArtworkImage && widget.source == cloudinaryCover,
      );
      expect(coverFinder, findsOneWidget);

      // Verify channel avatar mark uses the Cloudinary avatar URL
      final avatarFinder = find.byWidgetPredicate(
        (widget) => widget is ArtworkImage && widget.source == cloudinaryAvatar,
      );
      expect(avatarFinder, findsOneWidget);
    });
  });
}

