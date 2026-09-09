export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export interface WahaMessagePayload {
  id: string;
  from: string;
  fromMe: boolean;
  body: string;
  type: string;
  timestamp: number;
}

export interface WahaWebhookBody {
  event: string;
  session: string;
  payload: WahaMessagePayload;
}