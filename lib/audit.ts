export type Draft = { title: string; keyword: string; description: string; content: string };

const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
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
  const sections = content.split(/\r?\n/);
  const headings = sections.filter((line) => /^\s{0,3}#{2,6}\s+\S/.test(line));
  const opening = sections.filter((line) => !/^\s{0,3}#{1,6}\s+/.test(line)).join("\n");
  const keyword = words(draft.keyword);
  const wordCount = words(content).length;
  const checks = [
    { title: "Page title length", passed: title >= 30 && title <= 60, detail: `${title} characters. Aim for 30–60 as a writing guideline.` },
    { title: "Focus keyword in title", passed: containsPhrase(draft.title, keyword), detail: "Include the focus keyword in the page title when it reads naturally." },
    { title: "Meta description length", passed: description >= 70 && description <= 160, detail: `${description} characters. Aim for 70–160 as a writing guideline.` },
    { title: "Focus keyword in description", passed: containsPhrase(draft.description, keyword), detail: "Mention the focus keyword naturally when summarizing the page." },
    { title: "Focus keyword near the start", passed: containsPhrase(words(opening).slice(0, 100).join(" "), keyword), detail: "Introduce the topic in the first 100 words of the body." },
    { title: "Subheading structure", passed: headings.length > 0, detail: `${headings.length} Markdown subheadings found. Start subheadings with ## followed by a space.` },
    { title: "Focus keyword in a subheading", passed: headings.some((line) => containsPhrase(line, keyword)), detail: "Use the focus keyword in a subheading when it describes that section." },
    { title: "Draft length", passed: wordCount >= 300, detail: `${wordCount} words. This check uses 300 as a starting point. Write to the depth the topic needs.` },
  ];
  const passed = checks.filter((check) => check.passed).length;
  return { checks, passed, score: Math.round(100 * passed / checks.length), wordCount };
}

export const example: Draft = {
  title: "Email Marketing Strategy for Small Businesses",
  keyword: "email marketing strategy",
  description: "Build an email marketing strategy for your small business with clear goals, useful segments, and a manageable sending schedule.",
  content: `A good email marketing strategy starts with a question. What should subscribers get from hearing from your business? A coffee shop might share seasonal menus. A software business might explain how to use a feature. Choose a reason to email that makes sense for your audience.

## Start with one clear goal

Pick a goal the team can track, such as getting more product trials or encouraging customers to place a second order. Define one action for each email so the message has a clear purpose. Give readers enough context to decide whether that action is worth their time.

## Build a manageable schedule

Decide how often you can write a useful email. A monthly newsletter you can sustain is a practical starting point for a small team. Keep a list of timely topics and use subscriber questions to decide what to cover next. Review the results after a few sends.`,
};
