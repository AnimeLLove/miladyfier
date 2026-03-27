# Miladyfier

*miladyfying your timeline since 2026*


## Why

Some people want the opposite experience: a timeline that keeps the target avatars visible and filters out everything else. This fork does that.

## How It Works

A bundled ONNX classifier scans avatars as you scroll. In this fork, non-matching avatars are treated as filter hits, so you can choose what happens to everything that is not the target set:

- **Hide** — collapsed behind a click-to-reveal row.
- **Fade** — visible but at half opacity.
- **Debug** — borders and confidence scores on every post.
- **Off** — does nothing.

The popup tracks session stats, keeps a list of filtered accounts you can exempt individually, and collects avatar data you can export for offline labeling.

Everything runs locally. No server calls, no telemetry, nothing leaves your browser unless you explicitly export it.

## Install

There is no Chrome Web Store release. Install from GitHub Releases instead:

1. Download the latest `miladyfier-vX.Y.Z-unpacked.zip` from Releases.
2. Unzip it somewhere permanent on disk.
3. Open `chrome://extensions`.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped folder.

## Notes

- Development, debugging, and training workflow commands live in `DEVELOPMENT.md`.
- Runtime model artifacts live in `public/models/` and `public/generated/`.
- Training runs, labels, downloaded avatars, and dataset manifests live under ignored `cache/`.
- The review app supports both individual labeling and 9-up batch labeling.
- The extension runtime is ONNX-only.
- This fork bakes in the inverted score path instead of exposing it as a setting.
