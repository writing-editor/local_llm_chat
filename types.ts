// types.ts
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
}

export interface Chat {
  id: string; // A unique ID, e.g., from `Date.now()` or `crypto.randomUUID()`
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Persona {
  id: string;
  name: string;
  prompt: string;
  placeholder: string;
}