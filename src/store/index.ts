import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { nanoid } from "nanoid";

export const authStore = atomWithStorage<AuthAtom | undefined>(
  "auth",
  undefined
);

// export const clipboardStore = atom<ClipboardEntry[]>([]);
export const clipboardStore = atomWithStorage<ClipboardEntry[]>("clipboard", []);


export const connectionStore = atom<ConnectionAtom>();

export const settingStore = atomWithStorage<SettingAtom>("setting", {
  id: nanoid(10),
  theme: "light",
  language: 'zh-cn'
},undefined,{getOnInit:true});
