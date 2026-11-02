import 'package:flutter_test/flutter_test.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  test('agora rtc engine types and apis are resolvable', () {
    expect(createAgoraRtcEngine, isNotNull);
    expect(ChannelProfileType.channelProfileLiveBroadcasting, isNotNull);
    expect(ClientRoleType.clientRoleBroadcaster, isNotNull);
    expect(ClientRoleType.clientRoleAudience, isNotNull);
  });
}
