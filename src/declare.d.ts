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
  id: number;
  content: string;
  created_at: string;
};

declare type SettingAtom = {
  theme: Theme;
};

declare type Theme = "light" | "dark";
