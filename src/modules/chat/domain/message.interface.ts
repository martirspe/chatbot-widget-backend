
export type Role = 'user' | 'assistant';

export interface Message {
    id?: string; createdAt?: Date; role: Role; text: string; sessionId: string;
}
