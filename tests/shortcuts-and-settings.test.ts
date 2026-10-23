import { describe, it, expect } from "vitest";
import { DEFAULT_SHORTCUTS, ShortcutAction } from "@/lib/shortcuts/shortcut-context";

describe("Settings & Keyboard Shortcuts Safeguards", () => {
  it("should define valid default shortcuts for all core creation & search actions", () => {
    const requiredActions: ShortcutAction[] = [
      "openSearch",
      "openNewUrl",
      "openNewPackage",
      "openNewNote",
      "openNewTask",
    ];

    requiredActions.forEach((action) => {
      const binding = DEFAULT_SHORTCUTS[action];
      expect(binding).toBeDefined();
      expect(binding.key).toBeTruthy();
      expect(binding.ctrlOrCmd).toBe(true);
      expect(binding.label).toBeTruthy();
      expect(binding.description).toBeTruthy();
    });

    expect(DEFAULT_SHORTCUTS.openSearch.key).toBe("k");
    expect(DEFAULT_SHORTCUTS.openNewUrl.key).toBe("n");
    expect(DEFAULT_SHORTCUTS.openNewPackage.key).toBe("p");
    expect(DEFAULT_SHORTCUTS.openNewNote.key).toBe("j");
    expect(DEFAULT_SHORTCUTS.openNewTask.key).toBe("t");
  });

  it("should ensure all shortcut keys are alphanumeric single characters", () => {
    Object.values(DEFAULT_SHORTCUTS).forEach((binding) => {
      expect(binding.key.length).toBe(1);
      expect(/^[a-z0-9]$/i.test(binding.key)).toBe(true);
    });
  });
});
