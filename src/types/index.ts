export interface ClipboardEntry {
  id: number;
  content: string;
  created_at: string;
}

export interface OAuthCallbackPayload {
  token: string;
  email: string;
}

export interface AuthState {
  token?: string;
  email?: string;
}

