
export enum PromptTone {
  PROFESIONAL = 'Profesional',
  CREATIVO = 'Creativo',
  CONCISO = 'Conciso',
  ACADEMICO = 'Académico',
  CONVERSACIONAL = 'Conversacional'
}

export enum OutputFormat {
  MARKDOWN = 'Markdown',
  JSON = 'JSON',
  TEXTO_PLANO = 'Texto Plano'
}

export enum EducationLevel {
  B1 = '1º Básico',
  B2 = '2º Básico',
  B3 = '3º Básico',
  B4 = '4º Básico',
  B5 = '5º Básico',
  B6 = '6º Básico',
  B7 = '7º Básico',
  B8 = '8º Básico',
  M1 = '1º Medio',
  M2 = '2º Medio',
  M3 = '3º Medio',
  M4 = '4º Medio'
}

export enum EvaluationType {
  FEEDBACK_INMEDIATO = 'Feedback Inmediato / Gamificación',
  ANDAMIAJE = 'Andamiaje (Scaffolding)',
  REFLEXIVA = 'Autoevaluación Reflexiva',
  DEBUGGING = 'Desafíos de Error (Debugging)'
}

export interface PromptImprovement {
  improvedPrompt: string;
  explanation: string;
  techniquesUsed: string[];
  tips: string[];
  feedback?: {
    rating: 'positive' | 'negative' | null;
    comment?: string;
  };
}

export type MessageType = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  isQuestion?: boolean;
  result?: PromptImprovement;
}

export type AppState = 'INITIAL' | 'REFINING' | 'COMPLETED';

export interface HistoryItem {
  id: string;
  original: string;
  improved: PromptImprovement;
  timestamp: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  tone: PromptTone;
  format: OutputFormat;
  level: EducationLevel;
  evaluationType: EvaluationType;
  timestamp: number;
}
