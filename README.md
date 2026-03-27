# Milady Shrinkifier

Chrome extension that detects X/Twitter posts from accounts using a Milady Maker avatar and either hides, shrinks, or fades the whole post.

## Local workflow

1. Install JS deps: `pnpm install`
2. Install Python deps for the asset builder and classifier pipeline: `uv sync`
3. Download the Milady Maker corpus into the ignored cache folder:
   `pnpm run download:images`
   Faster resume-friendly option: `pnpm run download:images:aria2`
4. Generate the local hash index and ONNX prototype model: `pnpm run prepare:assets`
5. Build the extension: `pnpm run build`
6. Load `dist/` as an unpacked extension in Chrome

## Classifier workflow

The extension can export collected avatars as JSON manifests. The MobileNetV3-Small pipeline treats those exports as raw inputs and keeps all derived state under the ignored `cache/` tree.

1. Ingest one or more extension exports into the local SQLite catalog:
   `pnpm run ingest:avatars -- cache/milady-shrinkifier-avatars-*.json`
2. Download the unique avatar URLs and dedupe them by SHA-256:
   `pnpm run download:avatars`
3. Review and label avatars locally:
   `pnpm run review:avatars`
4. Materialize train/val/test manifests:
   `pnpm run build:dataset`
5. Train the classifier:
   `pnpm run train:classifier`
6. Score the downloaded catalog for hard-negative mining:
   `pnpm run score:classifier -- --run-id <run-id>`
7. Export the trained classifier to the extension runtime:
   `pnpm run export:classifier -- --run-id <run-id>`

## Notes

- Downloaded source images live under `cache/milady-maker/` and are ignored by Git.
- Export ingests, downloaded avatars, labels, dataset manifests, and checkpoints all live under `cache/` and are ignored by Git.
- The Milady token/image range is `0..9999`; the pipeline skips unreadable local files instead of crashing.
- Generated runtime assets land in `public/generated/` and `public/models/`.
- The extension currently targets Milady Maker only, but the data pipeline is structured so more collections can be added later.
