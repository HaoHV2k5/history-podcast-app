# Mobile design system

Flutter mobile first; web is a mobile preview capped at 480 px. Admin web is a separate project. “Sử Ký” is a prototype wordmark, not a confirmed final product name.

## Palette

| Role | Value |
|---|---|
| Paper | #FAF9F6 |
| Ink | #262522 |
| Muted text | #696660 |
| Accent red | #B83345 |
| Divider | #E0DDD7 |
| Soft surface | #EFEAE3 |

Use solid surfaces, quiet borders and a restrained accent. No gradients, generic AI hero art, invented historical imagery or aged parchment effects. Paper grain is subtle; glass is confined to the mini-player and becomes opaque at high contrast.

## Typography and layout

Be Vietnam Pro Regular/Medium for body/controls; Noto Serif for editorial headings; Cormorant Garamond SemiBold Italic for the wordmark only. Fonts are bundled in assets/fonts with OFL licenses. Vietnamese diacritics must remain legible. Use a 4/8 px spacing rhythm, 24 px page gutter and restrained corners. Images: avatar/channel/audio cover 1:1, video 16:9; these are prototype decisions pending backend policy.

Header and bottom navigation remain stable. Four tabs are Khám phá, Tìm kiếm, Thư viện, Cá nhân. Profile reveals workspaces and test settings progressively; publishing shows usable actions for eligible drafts rather than all production steps at once. Forms keep input on failure, show field errors and guard unsaved data. OTP/password recovery uses separate screens. Mock prompts/status must not be interpreted as completed backend operations.

## Motion

Root tabs retain visited subtrees and switch content immediately, without page sliding, scaling or whole-page opacity animation. A single tab indicator follows a critically damped spring and retargets from its current position/velocity under repeated taps. Inactive tabs exclude focus/semantics/pointers and pause tickers/carousel timers. Reduced motion snaps selection. Tab height accounts for actual label/font metrics; touch targets are at least 48 px.

Detail routes use the existing QuietPageMotion dissolve, 180 ms forward / 140 ms reverse. The accepted mini↔full player container morph and interactive drag cancellation remain. Keep animation short and responsive; do not add decorative movement throughout the screen. Unit/widget and browser checks are not a physical-device FPS benchmark.

## Accessibility and assets

Preserve scalable text, semantic labels/selected states, safe areas, scrollable forms and reduced motion/high contrast. Check 320 px phones, landscape and text 2×. Photos are temporary references; read ASSETS.md for source and rights limits. Technical FFmpeg audio/video fixtures are not historical content. User-picked files and personal preference data are not bundled in Git.
