declare type OAuthCallbackPayload = {
  token: string;
  email: string;
};

declare type AuthAtom = {
  token: string;
  email: string;
};

// declare type ClipboardAtom = {
//     content: string;
//     created_at: string;
// }

declare type ClipboardEntry = {
  id: string;
  type: number;
  content: string;
  created_at: string;
};

declare type SettingAtom = {
  id: string;
  theme: Theme;
  language: string;
  shortcut: {
    showOrHideClipboard?: { key?: string; event?: ShortcutHandler},
    showOrHideSetting?: { key?: string; event?: ShortcutHandler },
  }
};

declare type ShortcutAtom = {
  key?: string;
  event?: ShortcutEvent;
}



declare type ConnectionAtom = {
  id?: string;
  room?: string;
  devices?: { clientID: string }[]
  status?: number
}


declare type Theme = "light" | "dark";
