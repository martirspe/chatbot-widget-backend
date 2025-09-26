// Define los roles permitidos en el chat.
export type Role = 'user' | 'assistant';

// Interface que representa la estructura de un mensaje de chat.
export interface Message {
    id?: string;
    role: Role;
    message: string;
    sessionId: string;
    metadata?: any;
    createdAt?: Date;
}
