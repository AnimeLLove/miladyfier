import {
  DEFAULT_MATCHED_ACCOUNTS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
} from "./constants";
import type { DetectionStats, ExtensionSettings, MatchedAccountMap } from "./types";

export async function loadSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.sync.get({
    mode: DEFAULT_SETTINGS.mode,
    whitelistHandles: DEFAULT_SETTINGS.whitelistHandles,
  });
  return {
    mode: isMode(stored.mode) ? stored.mode : DEFAULT_SETTINGS.mode,
    whitelistHandles: normalizeWhitelistHandles(stored.whitelistHandles),
  };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set({
    mode: settings.mode,
    whitelistHandles: normalizeWhitelistHandles(settings.whitelistHandles),
  });
}

export async function loadStats(): Promise<DetectionStats> {
  const stored = await chrome.storage.local.get({
    stats: DEFAULT_STATS,
  });
  return normalizeStats(stored.stats);
}

export async function saveStats(stats: DetectionStats): Promise<void> {
  await chrome.storage.local.set({
    stats,
  });
}

export async function loadMatchedAccounts(): Promise<MatchedAccountMap> {
  const stored = await chrome.storage.local.get({
    matchedAccounts: DEFAULT_MATCHED_ACCOUNTS,
  });
  return normalizeMatchedAccounts(stored.matchedAccounts);
}

export async function saveMatchedAccounts(matchedAccounts: MatchedAccountMap): Promise<void> {
  await chrome.storage.local.set({
    matchedAccounts,
  });
}

export async function resetStats(): Promise<void> {
  await saveStats(DEFAULT_STATS);
}

export async function resetMatchedAccounts(): Promise<void> {
  await saveMatchedAccounts(DEFAULT_MATCHED_ACCOUNTS);
}

function isMode(value: unknown): value is ExtensionSettings["mode"] {
  return value === "off" || value === "hide" || value === "fade" || value === "debug";
}

function normalizeWhitelistHandles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SETTINGS.whitelistHandles;
  }

  return Array.from(
    new Set(
      value
        .filter((handle): handle is string => typeof handle === "string")
        .map((handle) => normalizeHandle(handle))
        .filter((handle) => handle.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function normalizeStats(value: unknown): DetectionStats {
  if (!value || typeof value !== "object") {
    return DEFAULT_STATS;
  }

  const candidate = value as Partial<DetectionStats>;
  return {
    tweetsScanned: readNumber(candidate.tweetsScanned),
    avatarsChecked: readNumber(candidate.avatarsChecked),
    cacheHits: readNumber(candidate.cacheHits),
    postsMatched: readNumber(candidate.postsMatched),
    phashMatches: readNumber(candidate.phashMatches),
    onnxMatches: readNumber(candidate.onnxMatches),
    errors: readNumber(candidate.errors),
    lastMatchAt: typeof candidate.lastMatchAt === "string" ? candidate.lastMatchAt : null,
  };
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeMatchedAccounts(value: unknown): MatchedAccountMap {
  if (!value || typeof value !== "object") {
    return DEFAULT_MATCHED_ACCOUNTS;
  }

  const normalized: MatchedAccountMap = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const candidate = entry as Record<string, unknown>;
    const handle = normalizeHandle(
      typeof candidate.handle === "string" && candidate.handle.length > 0 ? candidate.handle : key,
    );
    if (!handle) {
      continue;
    }

    normalized[handle] = {
      handle,
      displayName: typeof candidate.displayName === "string" ? candidate.displayName : null,
      postsMatched: readNumber(candidate.postsMatched),
      lastMatchedAt: typeof candidate.lastMatchedAt === "string" ? candidate.lastMatchedAt : null,
    };
  }

  return normalized;
}

function normalizeHandle(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}
