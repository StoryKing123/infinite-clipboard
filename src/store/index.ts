import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const authStore = atomWithStorage<AuthAtom | undefined>(
  "auth",
  undefined
);  

// export const clipboardStore = atom<ClipboardEntry[]>([]);
export const clipboardStore = atomWithStorage<ClipboardEntry[]>("clipboard", []);

export const settingStore = atomWithStorage<SettingAtom>("setting", {
  theme: "light",
});
