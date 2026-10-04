# Mock module

All records here are fictional UI fixtures, not server records or real identity/payment data.

- `fixtures/catalog.dart`: episodes, channels, comments, likes and demonstration moderation words.
- `fixtures/narrators.dart`: fictional narrator profiles/ratings/prices.
- `fixtures/studio_videos.dart`: simulated video metadata/transcripts; no upload/STT service.
- `services/`: local AppState/auth/checkout, Creator KYC/review, Narrator contract/profile, Wallet ledger, demo scenarios and password recovery.
- `bootstrap.dart`: the only application startup that creates the local mock state.
- `../../assets/mock/`: photos, generated technical audio/video and scenario JSON; OFL fonts are outside this subtree.

The root `*_state.dart` compatibility exports and `part` directives retain existing UI/tests. UI currently uses these local feature types directly. Replace feature state/DTO mappings and imports with real implementations before deleting the module; deleting the folder alone will not compile. Hardcoded mock hints in UI also need removal when their feature is integrated.

OTP 889900, example balances/limits/fees/timeouts, ID/account strings and sample rules are test fixtures only. Do not implement server policy from them. Mock preferences, flags and role checks do not provide authorization. No reset password, KYC, financial, upload or publish service is connected.
