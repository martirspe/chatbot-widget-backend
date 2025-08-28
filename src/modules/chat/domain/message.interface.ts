// Define los roles permitidos en el chat.
export type Role = 'user' | 'assistant';

// Interface que representa la estructura de un mensaje de chat.
export interface Message {
    id?: string;
    createdAt?: Date;
    role: Role;
    text: string;
    sessionId: string;
}
