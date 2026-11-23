export const qualityContentLimit = 100_000;
export const qualityKeywordLimit = 250;

export const qualityFactors = {
  grammar: "Grammar & spelling",
  readability: "Readability",
  usefulness: "Content usefulness",
  expertise: "Expertise & authority",
  depth: "Content depth",
  intent: "Search intent",
  headings: "Heading structure",
  keywords: "Keyword usage",
  faqs: "FAQs",
  redundancy: "Redundancy",
  engagement: "Engagement",
  eeat: "E-E-A-T",
} as const;

export type QualityFactor = keyof typeof qualityFactors;
export const qualityFactorKeys = Object.keys(qualityFactors) as QualityFactor[];
export const verdictTopics = {
  usefulness: "Usefulness for readers",
  expertise: "Demonstrated expertise",
  wording: "Clarity and natural language",
  originality: "Specificity and generic wording",
  gaps: "Important gaps",
  readiness: "Publishing readiness",
} as const;

export type QualitySubmission = { content: string; keyword: string; format: "text" | "html" };
export type QualityIssue = {
  factor: QualityFactor;
  severity: "high" | "medium" | "low";
  title: string;
  excerpt: string | null;
  why: string;
  how: string;
  suggestion: string | null;
};
export type QualityReport = {
  topic: string;
  overview: string;
  overallScore: number;
  factors: Record<QualityFactor, { score: number | null; summary: string }>;
  issues: QualityIssue[];
  verdict: Record<keyof typeof verdictTopics, string>;
};

export function qualityStatus(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 55) return "Needs Improvement";
  return "Poor Quality";
}
