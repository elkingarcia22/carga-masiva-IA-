import * as React from "react";

/**
 * Lets whatever is rendered inside the shell take over the whole content area.
 *
 * Section-level chrome — the tabs and the actions beside them — belongs to the
 * section, not to a record inside it. A screen that stands on its own (a cycle's
 * detail, with its own title, back affordance and actions) would otherwise sit
 * under navigation that no longer applies to it.
 *
 * `setChromeHidden` is meant to be called from event handlers, alongside
 * whatever state change opened the full-page view — not from an effect, which
 * would cost an extra render pass on every mount.
 */
export interface ShellChromeValue {
  isChromeHidden: boolean;
  setChromeHidden: (hidden: boolean) => void;
}

export const ShellChromeContext = React.createContext<ShellChromeValue | null>(null);

const NO_SHELL: ShellChromeValue = {
  isChromeHidden: false,
  setChromeHidden: () => {},
};

/**
 * Access to the shell's chrome. Falls back to a no-op outside a provider so
 * screens stay renderable on their own (tests, isolated previews).
 */
export function useShellChrome(): ShellChromeValue {
  return React.useContext(ShellChromeContext) ?? NO_SHELL;
}
