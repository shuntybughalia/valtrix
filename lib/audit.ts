export type Draft = { title: string; keyword: string; description: string; content: string };
export type AuditCategory = "AI search" | "Content value" | "On-page SEO";
export const auditCategories = [
  { name: "AI search", description: "Topic clarity, concise opening, and scannable structure" },
  { name: "Content value", description: "Examples, next steps, references, and specific details" },
  { name: "On-page SEO", description: "Page title and meta description" },
] as const satisfies readonly { name: AuditCategory; description: string }[];

const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
const words = (value: string) => Array.from(segmenter.segment(value.normalize("NFKC").toLowerCase()))
  .filter((segment) => segment.isWordLike)
  .map((segment) => segment.segment);

function containsPhrase(text: string, keyword: string[]) {
  const tokens = words(text);
  return keyword.length > 0 && tokens.some((_, index) => keyword.every((word, offset) => word === tokens[index + offset]));
}

export function audit(draft: Draft) {
  const title = Array.from(draft.title.trim()).length;
  const description = Array.from(draft.description.trim()).length;
  const content = draft.content.trim();
  const prose = content.replace(/^`{3,}[^\n]*\n[\s\S]*?^`{3,}[^\n]*$/gm, "");
  const sections = prose.split(/\r?\n/);
  const headings = sections.filter((line) => /^ {0,3}#{2,6}\s+\S/.test(line));
  const body = sections.map((line) => /^ {0,3}#{1,6}\s+/.test(line) ? "" : line).join("\n");
  const paragraphs = body.split(/\n\s*\n/).filter((paragraph) => /[\p{L}\p{N}]/u.test(paragraph));
  const opening = paragraphs[0] ?? "";
  const keyword = words(draft.keyword);
  const wordCount = words(content).length;
  const bodyWordCount = words(body).length;
  const openingWordCount = words(opening).length;
  const sentenceSizes = Array.from(sentenceSegmenter.segment(body), ({ segment }) => words(segment).length).filter(Boolean);
  const sentenceCount = sentenceSizes.length;
  const longestParagraph = paragraphs.reduce((longest, paragraph) => Math.max(longest, words(paragraph).length), 0);
  const hasExample = /\b(?:for example|for instance|such as|case study|sample scenario)\b/i.test(prose);
  const hasSteps = /^\s*\d+[.)]\s+\S/m.test(body) || /^ {0,3}#{2,6}\s+(?:step\s+\d+|how to|next steps)\b/im.test(prose);
  const hasReference = /https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#][^\s<>)\]]*)?/i.test(body);
  const proseWithoutLinks = prose.replace(/https?:\/\/[^\s<>)\]]+/gi, "");
  const hasSpecifics = /\b\d+(?:[.,]\d+)?\s*(?:%|percent\b|(?:minutes?|hours?|days?|weeks?|months?|years?|words?|people|users?|items?|kilometers?|km|miles?|kg)\b)|(?:[$€£₹]|\b(?:USD|INR|EUR|GBP)\s*)\d/i.test(proseWithoutLinks);
  const checks: { category: AuditCategory; title: string; passed: boolean; detail: string }[] = [
    { category: "AI search", title: "Topic stated early", passed: containsPhrase(words(body).slice(0, 100).join(" "), keyword), detail: "Name the main topic within the first 100 words so the opening has clear context." },
    { category: "AI search", title: "Concise opening", passed: openingWordCount >= 15 && openingWordCount <= 80 && /[.!?。！？]/.test(opening), detail: `${openingWordCount} opening words. Aim for a short, complete paragraph that gives the reader the answer or takeaway upfront.` },
    { category: "AI search", title: "Scannable sections", passed: headings.length >= 2, detail: `${headings.length} Markdown subheadings found. Use descriptive ## headings to separate the main ideas when the draft covers several points.` },
    { category: "AI search", title: "Focused paragraphs", passed: paragraphs.length > 0 && longestParagraph <= 120, detail: `Longest paragraph: ${longestParagraph} words. Split dense paragraphs where the subject changes.` },
    { category: "Content value", title: "Concrete example", passed: hasExample, detail: "Add a specific scenario or worked example showing how the advice applies." },
    { category: "Content value", title: "Actionable next steps", passed: hasSteps, detail: "Give readers a practical next step using a numbered list or a descriptive how-to section." },
    { category: "Content value", title: "Source links", passed: hasReference, detail: "Link to the original source for important claims. This check detects links and leaves source quality for editorial review." },
    { category: "Content value", title: "Specific figures or measurements", passed: hasSpecifics, detail: "Where useful, add a concrete figure, timeframe, cost, or measurement with context." },
    { category: "On-page SEO", title: "Page title length", passed: title >= 30 && title <= 60, detail: `${title} characters. Aim for 30-60 as a writing guideline.` },
    { category: "On-page SEO", title: "Focus keyword in title", passed: containsPhrase(draft.title, keyword), detail: "Include the focus keyword in the page title when it reads naturally." },
    { category: "On-page SEO", title: "Meta description length", passed: description >= 70 && description <= 160, detail: `${description} characters. Aim for 70-160 as a writing guideline.` },
    { category: "On-page SEO", title: "Focus keyword in description", passed: containsPhrase(draft.description, keyword), detail: "Mention the focus keyword naturally when summarizing the page." },
  ];
  const passed = checks.filter((check) => check.passed).length;
  const editorial = {
    headingCount: headings.length,
    wordsPerSentence: sentenceCount ? Math.round(bodyWordCount / sentenceCount) : null,
    sentenceRhythm: sentenceCount ? Math.round(100 * sentenceSizes.filter((size) => size >= 8 && size <= 24).length / sentenceCount) : null,
  };
  return { checks, passed, score: Math.round(100 * passed / checks.length), wordCount, editorial };
}

export const example: Draft = {
  title: "How to Audit Content for AI Search",
  keyword: "audit content for AI search",
  description: "Learn how to audit content for AI search by checking search intent, useful examples, and source links before publishing.",
  content: `To audit content for AI search, start with the reader's question. Give a direct answer in the opening, then use the rest of the page to explain when the advice applies and support important claims.

## Check search intent

Compare the search query with the promise in the page title. For example, a reader looking for a content audit checklist needs steps they can follow on a real page, whereas someone comparing audit tools needs criteria and trade-offs.

## Add useful examples and evidence

1. Pick a claim that could affect the reader's decision and add a source link next to it.
2. Add a worked example that shows how to apply the advice and where it might fail.
3. Read each section on its own and name the subject again if a sentence relies on context from an earlier section.

Use the audit to choose which edits to make first. Start with the answers or evidence the reader needs to act.`,
};
