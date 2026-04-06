export interface Scenario {
  id: number;
  drug: string;
  condition: string;
  icd: string;
  plan: string;
}

export interface Tool {
  id: string;
  label: string;
  initials: string;
  color: string;
  bg: string;
  darkBg: string;
  darkColor: string;
  baseLatency: number;
}

export interface ToolResult {
  id: string;
  latency: number;
}

export interface PADecision {
  decision: "APPROVED" | "DENIED" | "PENDING";
  rationale: string;
  factors: string[];
  confidence: number;
}

export interface PARequest {
  scenario: Scenario;
  toolResults: ToolResult[];
}
