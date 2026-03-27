import { DEFAULT_SETTINGS } from "./shared/constants";
import {
  loadMatchedAccounts,
  loadSettings,
  loadStats,
  resetMatchedAccounts,
  resetStats,
  saveSettings,
} from "./shared/storage";
import type { DetectionStats, FilterMode, MatchedAccount, MatchedAccountMap } from "./shared/types";

const styles = document.createElement("style");
styles.textContent = `
  :root {
    color-scheme: dark;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }

  body {
    margin: 0;
    background: linear-gradient(160deg, #120f17 0%, #23122d 100%);
    color: #f5f3ff;
    min-width: 280px;
  }

  .popup {
    padding: 18px 16px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .lede,
  .footnote {
    margin: 0;
    color: #d8d1e8;
    font-size: 13px;
    line-height: 1.5;
  }

  .mode-form {
    display: grid;
    gap: 10px;
    margin: 16px 0;
  }

  .mode-form label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid rgba(216, 209, 232, 0.15);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
  }

  .stats {
    margin: 18px 0 14px;
    padding: 14px 12px;
    border: 1px solid rgba(216, 209, 232, 0.15);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
  }

  .stats-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  h2 {
    margin: 0;
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #d8d1e8;
  }

  #reset-stats {
    border: 0;
    border-radius: 999px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.12);
    color: #f5f3ff;
    font: inherit;
    cursor: pointer;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    margin: 0;
  }

  .stats-grid div {
    min-width: 0;
  }

  .stats-grid dt {
    color: #b8b1ca;
    font-size: 11px;
    margin: 0 0 3px;
  }

  .stats-grid dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .accounts {
    margin: 18px 0 14px;
    padding: 14px 12px;
    border: 1px solid rgba(216, 209, 232, 0.15);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.05);
  }

  .accounts-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .account-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid rgba(216, 209, 232, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
  }

  .account-meta {
    min-width: 0;
  }

  .account-handle {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  .account-subline {
    margin: 4px 0 0;
    color: #b8b1ca;
    font-size: 12px;
  }

  .account-action {
    border: 0;
    border-radius: 999px;
    padding: 7px 10px;
    background: rgba(255, 255, 255, 0.12);
    color: #f5f3ff;
    font: inherit;
    cursor: pointer;
    white-space: nowrap;
  }

  .account-action[data-whitelisted="true"] {
    background: rgba(46, 204, 113, 0.18);
  }
`;
document.head.append(styles);

let currentSettings = DEFAULT_SETTINGS;
let currentMatchedAccounts: MatchedAccountMap = {};

void init();

async function init(): Promise<void> {
  const form = document.getElementById("mode-form");
  const resetButton = document.getElementById("reset-stats");
  const accountsList = document.getElementById("accounts-list");
  if (
    !(form instanceof HTMLFormElement) ||
    !(resetButton instanceof HTMLButtonElement) ||
    !(accountsList instanceof HTMLDivElement)
  ) {
    return;
  }

  const [settings, stats, matchedAccounts] = await Promise.all([
    loadSettings(),
    loadStats(),
    loadMatchedAccounts(),
  ]);
  currentSettings = settings;
  currentMatchedAccounts = matchedAccounts;
  setModeSelection(form, currentSettings.mode);
  renderStats(stats);
  renderMatchedAccounts(currentMatchedAccounts, currentSettings.whitelistHandles);

  form.addEventListener("change", async () => {
    const mode = getSelectedMode(form);
    currentSettings = {
      ...currentSettings,
      mode,
    };
    await saveSettings(currentSettings);
  });

  resetButton.addEventListener("click", async () => {
    await Promise.all([resetStats(), resetMatchedAccounts()]);
    renderStats(await loadStats());
    currentMatchedAccounts = await loadMatchedAccounts();
    renderMatchedAccounts(currentMatchedAccounts, currentSettings.whitelistHandles);
  });

  accountsList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const handle = target.dataset.handle;
    if (!handle) {
      return;
    }

    const nextWhitelist = currentSettings.whitelistHandles.includes(handle)
      ? currentSettings.whitelistHandles.filter((entry) => entry !== handle)
      : [...currentSettings.whitelistHandles, handle].sort((left, right) =>
          left.localeCompare(right),
        );

    currentSettings = {
      ...currentSettings,
      whitelistHandles: nextWhitelist,
    };
    await saveSettings(currentSettings);
    renderMatchedAccounts(currentMatchedAccounts, currentSettings.whitelistHandles);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.stats) {
        renderStats(normalizeStats(changes.stats.newValue));
      }
      if (changes.matchedAccounts) {
        currentMatchedAccounts = normalizeMatchedAccounts(changes.matchedAccounts.newValue);
        renderMatchedAccounts(currentMatchedAccounts, currentSettings.whitelistHandles);
      }
    }

    if (area === "sync") {
      if (changes.mode) {
        const mode = getStoredMode(changes.mode.newValue);
        currentSettings = {
          ...currentSettings,
          mode,
        };
        setModeSelection(form, mode);
      }
      if (changes.whitelistHandles) {
        currentSettings = {
          ...currentSettings,
          whitelistHandles: normalizeWhitelistHandles(changes.whitelistHandles.newValue),
        };
        renderMatchedAccounts(currentMatchedAccounts, currentSettings.whitelistHandles);
      }
    }
  });
}

function getSelectedMode(form: HTMLFormElement): FilterMode {
  const selected = new FormData(form).get("mode");
  if (
    selected === "hide" ||
    selected === "fade" ||
    selected === "debug" ||
    selected === "off"
  ) {
    return selected;
  }
  return DEFAULT_SETTINGS.mode;
}

function getStoredMode(value: unknown): FilterMode {
  if (value === "hide" || value === "fade" || value === "debug" || value === "off") {
    return value;
  }
  return DEFAULT_SETTINGS.mode;
}

function setModeSelection(form: HTMLFormElement, mode: FilterMode): void {
  const input = form.querySelector<HTMLInputElement>(`input[name="mode"][value="${mode}"]`);
  if (input) {
    input.checked = true;
  }
}

function renderStats(stats: DetectionStats): void {
  writeStat("tweetsScanned", formatNumber(stats.tweetsScanned));
  writeStat("avatarsChecked", formatNumber(stats.avatarsChecked));
  writeStat("cacheHits", formatNumber(stats.cacheHits));
  writeStat("postsMatched", formatNumber(stats.postsMatched));
  writeStat("phashMatches", formatNumber(stats.phashMatches));
  writeStat("onnxMatches", formatNumber(stats.onnxMatches));
  writeStat("errors", formatNumber(stats.errors));
  writeStat("lastMatchAt", stats.lastMatchAt ? formatDate(stats.lastMatchAt) : "Never");
}

function renderMatchedAccounts(
  matchedAccounts: MatchedAccountMap,
  whitelistHandles: string[],
): void {
  const accountsList = document.getElementById("accounts-list");
  const empty = document.getElementById("accounts-empty");
  if (!(accountsList instanceof HTMLDivElement) || !(empty instanceof HTMLParagraphElement)) {
    return;
  }

  const entries = Object.values(matchedAccounts).sort(compareAccounts);
  empty.hidden = entries.length > 0;
  accountsList.replaceChildren();

  for (const account of entries) {
    const row = document.createElement("div");
    row.className = "account-row";

    const meta = document.createElement("div");
    meta.className = "account-meta";

    const handle = document.createElement("p");
    handle.className = "account-handle";
    handle.textContent = `@${account.handle}`;

    const subline = document.createElement("p");
    subline.className = "account-subline";
    subline.textContent = `${formatNumber(account.postsMatched)} matched posts`;

    meta.append(handle, subline);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "account-action";
    button.dataset.handle = account.handle;
    button.dataset.whitelisted = String(whitelistHandles.includes(account.handle));
    button.textContent = whitelistHandles.includes(account.handle) ? "Whitelisted" : "Whitelist";

    row.append(meta, button);
    accountsList.append(row);
  }
}

function writeStat(name: keyof DetectionStats, value: string): void {
  const node = document.querySelector<HTMLElement>(`[data-stat="${name}"]`);
  if (node) {
    node.textContent = value;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function normalizeStats(value: unknown): DetectionStats {
  if (!value || typeof value !== "object") {
    return emptyStats();
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

function normalizeWhitelistHandles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((handle): handle is string => typeof handle === "string")
        .map((handle) => handle.trim().replace(/^@+/, "").toLowerCase())
        .filter((handle) => handle.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function normalizeMatchedAccounts(value: unknown): MatchedAccountMap {
  if (!value || typeof value !== "object") {
    return {};
  }

  const normalized: MatchedAccountMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const candidate = entry as Partial<MatchedAccount>;
    const handle = typeof candidate.handle === "string" && candidate.handle.length > 0
      ? candidate.handle
      : key;
    const normalizedHandle = handle.trim().replace(/^@+/, "").toLowerCase();
    if (!normalizedHandle) {
      continue;
    }
    normalized[normalizedHandle] = {
      handle: normalizedHandle,
      displayName: typeof candidate.displayName === "string" ? candidate.displayName : null,
      postsMatched: readNumber(candidate.postsMatched),
      lastMatchedAt: typeof candidate.lastMatchedAt === "string" ? candidate.lastMatchedAt : null,
    };
  }
  return normalized;
}

function compareAccounts(left: MatchedAccount, right: MatchedAccount): number {
  if (right.postsMatched !== left.postsMatched) {
    return right.postsMatched - left.postsMatched;
  }
  return left.handle.localeCompare(right.handle);
}

function emptyStats(): DetectionStats {
  return {
    tweetsScanned: 0,
    avatarsChecked: 0,
    cacheHits: 0,
    postsMatched: 0,
    phashMatches: 0,
    onnxMatches: 0,
    errors: 0,
    lastMatchAt: null,
  };
}
