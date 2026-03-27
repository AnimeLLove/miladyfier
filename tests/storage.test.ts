import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "../src/shared/constants";
import { loadSettings, saveSettings } from "../src/shared/storage";

describe("settings storage", () => {
  const get = vi.fn();
  const set = vi.fn();

  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    globalThis.chrome = {
      storage: {
        sync: {
          get,
          set,
        },
      },
    } as unknown as typeof chrome;
  });

  it("defaults invertScore to false when missing from storage", async () => {
    get.mockResolvedValue({
      mode: "hide",
      whitelistHandles: ["Alice"],
    });

    await expect(loadSettings()).resolves.toEqual({
      mode: "hide",
      invertScore: false,
      whitelistHandles: ["alice"],
    });
  });

  it("persists invertScore with the other sync settings", async () => {
    set.mockResolvedValue(undefined);

    await saveSettings({
      ...DEFAULT_SETTINGS,
      mode: "debug",
      invertScore: true,
      whitelistHandles: ["Bob"],
    });

    expect(set).toHaveBeenCalledWith({
      mode: "debug",
      invertScore: true,
      whitelistHandles: ["bob"],
    });
  });
});
