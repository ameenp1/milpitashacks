// Shared contracts for the chat surface. This is the ONLY file multiple roles
// depend on (see PLAN.md §5). Changes here are additive and must be announced.
import type { QuestionGroup } from "@/lib/types";

export interface Msg {
  id: number;
  role: "bot" | "user";
  text: string;
  speak?: boolean; // bot turns the transcript should read aloud
}

export interface DetectedLanguage {
  code: string;
  label: string;
}

export interface ChatResult {
  type: "answer" | "question" | "unclear";
  value: string;
  reply: string;
  detectedLanguage?: DetectedLanguage;
}

// Role 2 (Voice) builds against these.
export interface ChatTranscriptProps {
  messages: Msg[];
  sending: boolean;
  hearMode: boolean;
  voice: string;
  speak: (text: string, voice?: string) => void;
}

export interface ChatComposerProps {
  currentGroup: QuestionGroup | null;
  sending: boolean;
  language: string; // STT hint for the mic
  speaking: boolean; // assistant is reading a turn aloud (for auto-listen)
  hearMode: boolean; // voice mode → auto-listen after the assistant speaks
  t: (s: string) => string;
  onSubmit: (text: string) => void;
  onSkip: () => void;
}

// Role 3 (Document) builds against these.
export interface DocumentPanelProps {
  activeForm: string;
  answers: Record<string, string>;
  activeValue?: string; // last-answered value -> scroll/highlight target
  t: (s: string) => string;
  onSwitchForm: (id: string) => void;
  onEditField: (group: string, value: string) => void;
}
