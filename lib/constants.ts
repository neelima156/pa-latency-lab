import type { Scenario, Tool } from "./types";

export const SCENARIOS: Scenario[] = [
  { id: 0, drug: "Adalimumab (Humira)",  condition: "Rheumatoid Arthritis", icd: "M05.9",  plan: "Commercial PPO"      },
  { id: 1, drug: "Apixaban (Eliquis)",   condition: "Atrial Fibrillation",  icd: "I48.91", plan: "Medicare Advantage"  },
  { id: 2, drug: "Dupilumab (Dupixent)", condition: "Atopic Dermatitis",    icd: "L20.9",  plan: "Medicaid"            },
];

export const TOOLS: Tool[] = [
  { id: "patient_history",     label: "Patient history",     initials: "PH", color: "#1D9E75", bg: "#E1F5EE", darkBg: "#085041", darkColor: "#9FE1CB", baseLatency: 850 },
  { id: "formulary_check",     label: "Formulary check",     initials: "FC", color: "#BA7517", bg: "#FAEEDA", darkBg: "#633806", darkColor: "#FAC775", baseLatency: 620 },
  { id: "coverage_validation", label: "Coverage validation", initials: "CV", color: "#534AB7", bg: "#EEEDFE", darkBg: "#26215C", darkColor: "#CECBF6", baseLatency: 740 },
];

export const MOCK_DATA: Record<string, object> = {
  patient_history:     { failedTherapies: ["Methotrexate"], priorDiagnoses: ["M05.9", "E11.9"], priorAuths: 2 },
  formulary_check:     { tier: 3, covered: true, stepTherapyRequired: true },
  coverage_validation: { deductibleMet: "75%", network: "preferred", copay: 60 },
};

export const CACHE_HIT_MS = 185;
