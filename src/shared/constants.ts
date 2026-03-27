import type {
  CollectedAvatarMap,
  DetectionStats,
  ExtensionSettings,
  MatchedAccountMap,
} from "./types";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  mode: "off",
  whitelistHandles: [],
};

export const DEFAULT_STATS: DetectionStats = {
  tweetsScanned: 0,
  avatarsChecked: 0,
  cacheHits: 0,
  postsMatched: 0,
  phashMatches: 0,
  onnxMatches: 0,
  errors: 0,
  lastMatchAt: null,
};

export const DEFAULT_MATCHED_ACCOUNTS: MatchedAccountMap = {};
export const DEFAULT_COLLECTED_AVATARS: CollectedAvatarMap = {};

export const HASH_MATCH_THRESHOLD = 8;
export const HASH_ONNX_THRESHOLD = 18;
export const COLOR_DISTANCE_THRESHOLD = 120;
export const LEGACY_MODEL_INPUT_LENGTH = 32 * 32;
export const CLASSIFIER_MODEL_INPUT_SIZE = 128;
export const CLASSIFIER_MODEL_CHANNELS = 3;
export const CLASSIFIER_MODEL_MEAN: [number, number, number] = [0.485, 0.456, 0.406];
export const CLASSIFIER_MODEL_STD: [number, number, number] = [0.229, 0.224, 0.225];
export const HASH_URL = "generated/milady-maker.hashes.json";
export const CLASSIFIER_MODEL_METADATA_URL = "generated/milady-mobilenetv3-small.meta.json";
export const CLASSIFIER_MODEL_URL = "models/milady-mobilenetv3-small.onnx";
export const LEGACY_MODEL_METADATA_URL = "generated/milady-prototype.meta.json";
export const LEGACY_MODEL_URL = "models/milady-prototype.onnx";
