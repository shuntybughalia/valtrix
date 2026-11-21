import type { Draft } from "./audit";

export const intents = ["Informational", "Commercial", "Transactional", "Navigational"] as const;
type Intent = (typeof intents)[number];

export type AuditSettings = {
  intent?: Intent;
  secondaryKeywords?: string;
  expectedTopics?: string;
  expectedEntities?: string;
  asOfYear: number;
};

export const exampleAuditSettings: AuditSettings = {
  asOfYear: 2026,
  intent: "Informational",
  expectedTopics: "search intent, worked example, source link",
  expectedEntities: "search query, page title, content audit checklist",
};

const words = (text: string) => text.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const normalized = (text: string) => words(text).join(" ");
const continuation = /\b(?:because|means|refers to|works by|helps|allows|when|by|start)\b/i;
const list = (text = "") => [...new Map(text.split(/[,;\n]/).map((item) => [normalized(item), item.trim()])).entries()]
  .filter(([key]) => key).slice(0, 24).map(([, value]) => value);
const contains = (text: string, phrase: string) => Boolean(normalized(phrase)) && (' ' + normalized(text) + ' ').includes(' ' + normalized(phrase) + ' ');
const strength = (text: string) => words(text).length >= 8 && new Set(words(text)).size >= 7;
const evidenceLink = /https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#][^\s<>)\]]*)?/i;
const action = /\b(?:choose|compare|check|measure|record|test|set|calculate|use|start|try|review|track|create|add|remove|select|open|visit|pick|define|keep|decide|look|buy|book|download|sign up|log in)\b/i;
const vague = /\b(?:in today'?s (?:fast-paced|digital) world|it is important to note|when it comes to|game[- ]changer|unlock the power|take it to the next level|look no further|in conclusion, it is clear)\b/i;
const absolute = /\b(?:guaranteed|always works|never fails|risk[- ]free|100% effective|everyone agrees|proven to)\b/i;
const quantified = /\b\d+(?:[.,]\d+)?\s*(?:%|percent\b|times more\b|times faster\b)/i;
const temporal = /\b(?:currently|latest|as of|this year|today|current price|price in)\b/i;

export function validateDraft(draft: Draft) {
  if (!draft.title.trim() || !words(draft.keyword).length) return "Enter a page title and a focus keyword or search query.";
  if (!words(cleanDraft(draft.content)).some((word) => /\p{L}/u.test(word))) return "Enter draft text with readable words.";
  if (draft.title.length > 300 || draft.keyword.length > 120 || draft.description.length > 500 || draft.content.length > 100000) return "The draft exceeds a field limit.";
  return null;
}

function cleanDraft(content: string) {
  return content.replace(/\r\n?/g, "\n").replace(/^ {0,3}(\x60{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm, "").trim();
}

function inferIntent(query: string) {
  if (/^(?:go to|visit|log ?in|sign in)\b|\b(?:official (?:site|website)|homepage|login|support portal)\b/i.test(query)) return "Navigational";
  if (/^(?:buy|book|order|download|hire|subscribe)\b|\b(?:near me|coupon|discount)\b/i.test(query)) return "Transactional";
  if (/\b(?:best|vs|versus|reviews?|alternatives|compare|pricing|cost)\b/i.test(query)) return "Commercial";
  if (/^(?:how|what|why|when|where|can|should|is|does)\b|\b(?:guide|definition|tutorial|tips)\b/i.test(query)) return "Informational";
  return null;
}

type Criterion = { points: number; met: boolean; reason: string; improvement: string; available: boolean };
const rule = (points: number, met: boolean, reason: string, improvement: string, available = true): Criterion => ({ points, met, reason, improvement, available });
function category(name: string, maximum: number, rules: Criterion[], unavailable?: string) {
  return {
    name, maximum,
    evaluated: unavailable ? 0 : rules.reduce((sum, item) => sum + (item.available ? item.points : 0), 0),
    achieved: unavailable ? null : rules.reduce((sum, item) => sum + (item.available && item.met ? item.points : 0), 0),
    reason: unavailable ?? rules.map(({ available, met, points, reason }) => reason + ' (' + (available ? (met ? points : 0) + '/' + points : points + ' points not evaluated') + ')').join(' '),
    improvements: rules.filter((item) => !item.met).map((item) => item.improvement),
    rules,
  };
}

export function classify(score: number) {
  if (score >= 90) return "Excellent AI SEO Content";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Needs Improvement";
  if (score >= 40) return "Poor";
  return "Very Poor";
}

export function evaluateContent(draft: Draft, settings: AuditSettings) {
  const invalid = validateDraft(draft);
  if (invalid) throw new Error(invalid);
  if (!Number.isInteger(settings.asOfYear) || settings.asOfYear < 1900 || settings.asOfYear > 2200) throw new Error("Choose an evaluation year between 1900 and 2200.");

  const prose = cleanDraft(draft.content);
  const lines = prose.split("\n");
  const headings = lines.flatMap((line) => {
    const match = line.match(/^ {0,3}(#{1,6})[ \t]+(.+)/);
    return match ? [{ level: match[1].length, text: match[2].trim() }] : [];
  });
  const blocks = prose.split(/(?:^|\n) {0,3}#{1,6}[ \t]+[^\n]*\n|\n[ \t]*\n/).map((block) => block.trim()).filter((block) => words(block).length);
  const opening = blocks[0] ?? "";
  const body = blocks.join("\n\n");
  const plain = body.replace(/https?:\/\/[^\s<>)\]]+/gi, "");
  const sentences = plain.split(/(?<=[.!?。！？])\s+|\n+/u).filter((line) => words(line).length);
  const substantive = sentences.filter(strength);
  const totalWords = words(plain).length;
  const unique = new Set(substantive.map(normalized));
  const repeats = substantive.length - unique.size;
  const filler = sentences.filter((sentence) => vague.test(sentence.replaceAll("\u2019", "'")));
  const fillerSentences = new Set(filler);
  const seenSentences = new Set<string>();
  let flaggedSentences = 0;
  for (const sentence of sentences) {
    const key = normalized(sentence);
    if (fillerSentences.has(sentence) || (seenSentences.has(key) && words(sentence).length >= 5)) flaggedSentences++;
    seenSentences.add(key);
  }
  const aiWording = {
    score: sentences.length ? Math.round(100 * flaggedSentences / sentences.length) : null,
    flaggedSentences,
    sentenceCount: sentences.length,
  };
  const query = draft.keyword.trim();
  const topicWords = [...new Set(words(query).filter((word) => word.length > 2 && !/^(?:how|what|why|when|where|the|for|and|with|best|buy|book|near|can|does|should)$/.test(word)))];
  const onTopic = (text: string) => {
    const tokens = new Set(words(text));
    return topicWords.length
      ? topicWords.filter((word) => tokens.has(word)).length >= Math.ceil(topicWords.length / 2)
      : contains(text, query);
  };
  const queryTokens = words(query);
  const bodyTokens = words(plain);
  const firstQueryToken = queryTokens[0];
  const phrases = bodyTokens.reduce((count, token, index) => count + Number(token === firstQueryToken
    && queryTokens.every((part, offset) => bodyTokens[index + offset] === part)), 0);
  const stuffing = phrases >= 3 && phrases * words(query).length / Math.max(totalWords, 1) > .08;
  const unrelated = blocks.filter((block) => strength(block) && !onTopic(block));
  const titleRelevant = onTopic(draft.title);
  const directOpening = strength(opening) && onTopic(opening) && words(opening).length <= 90 && substantive.some((sentence) => opening.includes(sentence) && !sentence.trim().endsWith("?"));
  const evidence = [...new Set(substantive.filter((sentence) => onTopic(sentence) && /\b(?:for example|for instance|such as|case study|in our test)\b/i.test(sentence)).map(normalized))];
  const usefulActions = [...new Set(substantive.filter((sentence) => action.test(sentence) && !vague.test(sentence)).map(normalized))];
  const topicBrief = list(settings.expectedTopics);
  const entityBrief = list(settings.expectedEntities);
  const secondary = list(settings.secondaryKeywords);
  const missingTopics = topicBrief.filter((item) => !substantive.some((sentence) => contains(sentence, item)));
  const missingEntities = entityBrief.filter((item) => !substantive.some((sentence) => contains(sentence, item)));
  const missingSecondary = secondary.filter((item) => !substantive.some((sentence) => contains(sentence, item)));
  const intent = settings.intent ?? inferIntent(query);
  const intentEvidence = {
    Informational: new Set(substantive.filter((line) => onTopic(line) && continuation.test(line)).map(normalized)).size >= 2,
    Commercial: substantive.some((line) => /\b(?:compare|versus|alternative|trade-off|pros and cons)\b/i.test(line)) && /\b(?:cost|price|budget|speed|features|compatibility|limitations)\b/i.test(plain),
    Transactional: evidenceLink.test(body) && substantive.some((line) => /\b(?:buy|book|order|checkout|download|sign up|register)\b/i.test(line)),
    Navigational: evidenceLink.test(body) && substantive.some((line) => onTopic(line) && /\b(?:open|visit|go to|log in|sign in|official)\b/i.test(line)),
  };

  const unsupported = blocks.flatMap((block) => {
    if (evidenceLink.test(block)) return [];
    return block.split(/(?<=[.!?])\s+|\n+/).filter((line) => quantified.test(line) || absolute.test(line));
  });
  const linkedClaims = blocks.some((block) => (quantified.test(block.replace(/https?:\/\/[^\s<>)\]]+/gi, "")) || absolute.test(block)) && evidenceLink.test(block));
  const strongClaims = sentences.filter((line) => absolute.test(line));
  const factualSignals = unsupported.length > 0 || linkedClaims || strongClaims.length > 0;
  const opposing = new Map<string, number>();
  const contradictions = new Set<string>();
  for (const sentence of sentences) {
    const match = normalized(sentence).match(/^(.+?) (is|are|can|should|does|will) (not )?(.+)$/);
    if (!match || !strength(sentence)) continue;
    const key = match[1] + ' ' + match[2] + ' ' + match[4];
    const polarity = match[3] ? -1 : 1;
    if (opposing.has(key) && opposing.get(key) !== polarity) contradictions.add(sentence.trim());
    opposing.set(key, polarity);
  }

  const dated = sentences.filter((sentence) => temporal.test(sentence));
  const datedYears = dated.flatMap((sentence) => [...sentence.matchAll(/\b(?:19|20)\d{2}\b/g)].map(([year]) => Number(year)));
  const stale = dated.filter((sentence) => [...sentence.matchAll(/\b(?:19|20)\d{2}\b/g)].some(([year]) => Number(year) < settings.asOfYear - 1 || Number(year) > settings.asOfYear));
  const comparison = substantive.some((line) => onTopic(line) && /\b(?:trade-off|tradeoff|limitation|whereas|compared with|depends on|unless)\b/i.test(line));
  const method = substantive.some((line) => onTopic(line) && /\b(?:in our test|we tested|we measured|we observed|our experiment)\b/i.test(line));
  const namedAuthor = /^(?:by|author|reviewed by)[: \t]+[^\n]+/im.test(prose);
  const credited = namedAuthor && /\b(?:credentials|qualification|experience|certified|licensed|editor|researcher)\b/i.test(prose);
  const attributed = blocks.some((block) => evidenceLink.test(block) && /\b(?:according to|published by|reported by|documentation|study by|source:)/i.test(block));
  const answerPairs = lines.flatMap((line, index) => {
    const question = line.match(/^ {0,3}#{1,6}[ \t]+(.+\?)\s*$/)?.[1];
    if (!question) return [];
    const nextHeading = lines.findIndex((next, position) => position > index && /^ {0,3}#{1,6}[ \t]+/.test(next));
    const passage = lines.slice(index + 1, nextHeading < 0 ? lines.length : nextHeading).join("\n").trim().split(/\n[ \t]*\n/)[0];
    return [{ text: question, useful: onTopic(question + ' ' + passage) && strength(passage) && words(passage).length <= 100 && !passage.trim().endsWith("?") }];
  });
  const cleanHierarchy = headings.filter(({ level }) => level === 1).length <= 1
    && headings.every(({ level }, i) => level <= (headings[i - 1]?.level ?? 1) + 1);
  const complex = sentences.filter((line) => words(line).length > 34).length;
  const openingAnswer = directOpening && /\b(?:is|are|means|refers to|works by|start|use|choose|helps)\b/i.test(opening);
  const gaps = !topicBrief.length && !entityBrief.length;
  const reviewed = [
    category("Search Intent Optimization", 10, [
      rule(3, directOpening && titleRelevant, "Checked whether the opening and title establish the query topic.", "Put the query's main takeaway in the opening and align the page title."),
      rule(5, Boolean(intent && intentEvidence[intent]), "Looked for content serving the " + (intent?.toLowerCase() ?? "unclear") + " intent.", "Add the information, comparison, transaction instructions, or destination the searcher needs."),
      rule(2, substantive.length > 0 && unrelated.length === 0, unrelated.length + " paragraph(s) lack a direct query-term connection.", "Review paragraphs flagged for a weak topic connection and clarify their purpose."),
    ], intent ? undefined : "Intent is ambiguous from this query. Select the intended audience goal in the editor."),
    category("Topical Coverage & Depth", 10, [
      rule(5, topicBrief.length > 0 && missingTopics.length === 0, topicBrief.length ? (topicBrief.length - missingTopics.length) + '/' + topicBrief.length + " supplied subtopics appear in explanatory sentences." : "Comprehensiveness is unknown without a topic brief.", "Provide the expected subtopics and explain each where relevant.", topicBrief.length > 0),
      rule(3, new Set(substantive.filter(onTopic).map(normalized)).size >= 3 && (comparison || evidence.length > 0), "Looked for several distinct, on-topic explanations with an example or trade-off.", "Explain how the topic works and illustrate a trade-off or practical example."),
      rule(2, blocks.filter((block) => strength(block) && onTopic(block)).length >= 2, "Looked for distinct relevant passages with explanatory context.", "Build out the weak sections with separate, meaningful explanations."),
    ], !topicBrief.length && !substantive.length ? "Insufficient prose or a topic brief to assess depth." : undefined),
    category("Content Quality & Helpfulness", 10, [
      rule(4, usefulActions.length >= 2 && substantive.some((line) => onTopic(line) && action.test(line)), "Found " + usefulActions.length + " distinct instruction-like sentences.", "Give readers at least one practical action and explain how to complete it."),
      rule(3, substantive.length >= 2 && filler.length === 0 && repeats === 0, repeats + " repeated substantive sentence(s) and " + filler.length + " stock-phrase match(es).", "Replace repeated or generic passages with concrete information."),
      rule(3, substantive.length >= 2 && unrelated.length <= Math.floor(blocks.length / 4), "Checked relevance and whether the draft contains multiple explanatory sentences.", "Keep explanations tied to the query and remove unrelated material."),
    ]),
    category("Information Gain & Originality", 10, [
      rule(4, evidence.length > 0, "Found " + evidence.length + " distinct on-topic example signal(s).", "Add an on-topic worked example with context and an outcome."),
      rule(3, comparison, "Looked for a contextual comparison, trade-off, or limitation.", "Explain when the advice changes and what trade-offs readers should expect."),
      rule(3, method && repeats === 0, "Looked for a description of first-hand testing or measurement.", "Describe the method and findings if you have documented first-hand evidence."),
    ], !substantive.length ? "There are too few explanatory sentences to assess information gain. External originality is outside this audit." : undefined),
    category("E-E-A-T Signals", 10, [
      rule(3, method, "Checked for described first-hand methods or observations.", "If applicable, describe what was tested, how, and under what conditions."),
      rule(2, evidence.length > 0 && substantive.some((line) => onTopic(line) && /\bbecause\b/i.test(line)), "Looked for explanations that connect an example to the reasoning.", "Explain the reasoning behind recommendations and specify their limits."),
      rule(2, credited, "Checked for a byline and a credential reference.", "Add an accurate author or reviewer byline and relevant credentials where available."),
      rule(3, attributed && unsupported.length === 0 && strongClaims.length === 0, "Checked for references attributed in context and unsupported or absolute claims.", "Attribute material claims to their sources and qualify absolute language."),
    ]),
    category("Semantic SEO & Entity Coverage", 10, [
      rule(5, entityBrief.length > 0 && missingEntities.length === 0, entityBrief.length ? (entityBrief.length - missingEntities.length) + '/' + entityBrief.length + " supplied entities appear in explanatory text." : "Entity completeness is unknown without a supplied list.", "Supply the important entities or related concepts, then explain their relationship to the topic.", entityBrief.length > 0),
      rule(3, substantive.filter(onTopic).length >= 2 && (comparison || openingAnswer), "Looked for related explanations or comparisons in context.", "Explain how the core concepts relate instead of listing names."),
      rule(2, !stuffing && substantive.filter(onTopic).length >= 2, "Checked for concentrated exact-query repetition in relevant prose.", "Use natural topic language and remove repeated exact-match phrasing."),
    ], !entityBrief.length && !substantive.some(onTopic) ? "There is no entity brief or relevant explanatory prose to assess." : undefined),
    category("Keyword Optimization", 8, [
      rule(3, titleRelevant && directOpening && !stuffing, "Checked title and opening relevance without concentrated exact-match use.", "Use the query naturally in the title and opening where it clarifies meaning."),
      rule(2, !stuffing && substantive.filter(onTopic).length >= 2, "Checked topical phrasing across the body.", "Vary the wording and avoid repeating the complete query unnecessarily."),
      rule(2, (headings.length === 0 || headings.some(({ text }) => onTopic(text))) && blocks.length > 1 && strength(blocks.at(-1) ?? "") && onTopic(blocks.at(-1) ?? "") && !stuffing, "Checked headings where present and the closing passage for topic alignment.", "Use a relevant section heading and close with a useful, on-topic takeaway."),
      rule(1, secondary.length > 0 ? !missingSecondary.length && !stuffing : !stuffing && substantive.filter(onTopic).length >= 3 && phrases < substantive.length, secondary.length ? (secondary.length - missingSecondary.length) + '/' + secondary.length + " supplied secondary terms appear in context." : "Checked natural variation across relevant passages. Secondary terms were optional.", "Work supplied secondary terms into relevant explanations where useful."),
    ]),
    category("Answer & Question Optimization", 8, [
      rule(4, openingAnswer, "Checked for a concise, topical opening with answer-like wording.", "Write a self-contained answer or definition before expanding on the details."),
      rule(2, answerPairs.some(({ useful }) => useful) || (openingAnswer && usefulActions.length >= 2), "Looked for a supported question heading or an answer with practical follow-through.", "Answer an important reader question under the heading or add the steps that complete the opening answer."),
      rule(2, answerPairs.length ? answerPairs.every(({ useful }) => useful) : openingAnswer && comparison, "Checked whether question headings have substantive answers, or whether the direct answer includes relevant nuance.", "Replace thin FAQ answers with concise explanations, conditions, or examples."),
    ]),
    category("Structure & Readability", 7, [
      rule(2, cleanHierarchy && substantive.length >= 2, "Checked Markdown heading order and basic prose structure.", "Use a logical heading hierarchy and separate genuinely different ideas."),
      rule(3, substantive.length >= 2 && complex * 3 <= sentences.length && blocks.every((block) => words(block).length <= 120), complex + " sentence(s) exceed 34 words.", "Split dense passages and simplify sentences that contain several ideas."),
      rule(2, substantive.length >= 2 && repeats === 0 && (blocks.length <= 2 || headings.length > 0), "Checked repeated sentences and whether longer drafts have visible sections.", "Remove repeated sentences and use headings or lists where they help readers."),
    ]),
    category("Factual Accuracy & Trust", 7, [
      rule(3, linkedClaims && !unsupported.length, unsupported.length + " quantified or absolute claim candidate(s) lack a nearby link.", "Check quantified claims against primary sources and add references next to them."),
      rule(2, !strongClaims.length, strongClaims.length + " absolute claim candidate(s) found.", "Qualify absolute language and explain any conditions or limits."),
      rule(2, !contradictions.size, contradictions.size + " directly opposing statement candidate(s) found.", "Reconcile conflicting statements and verify the evidence before publishing."),
    ], factualSignals || contradictions.size ? undefined : "No claims suitable for this limited citation and contradiction scan were identified. External accuracy was not checked."),
    category("AI Search Readability", 5, [
      rule(3, openingAnswer, "Looked for a self-contained answer passage near the start.", "Make the opening answer understandable on its own and name the subject explicitly."),
      rule(2, substantive.filter(onTopic).length >= 2 && (headings.length > 0 || blocks.length <= 2) && !stuffing, "Checked whether relevant explanation follows a clear structure.", "Make entity relationships explicit and use concise, logically ordered passages."),
    ]),
    category("Freshness & Relevance", 5, [
      rule(3, datedYears.length > 0 && !stale.length, stale.length + " current-claim passage(s) contain older or future years relative to " + settings.asOfYear + ".", "Review whether dates and details in time-sensitive claims are still applicable."),
      rule(2, dated.length > 0 && dated.every((sentence) => /\b(?:19|20)\d{2}\b/.test(sentence) || blocks.some((block) => block.includes(sentence) && evidenceLink.test(block))), "Checked time-sensitive wording for dates or nearby source links.", "Anchor current claims to an as-of date or an attributable reference."),
    ], dated.length ? undefined : "No clear time-sensitive claims found. Evergreen drafts are exempt from freshness checks."),
  ];

  const evaluated = reviewed.reduce((sum, item) => sum + item.evaluated, 0);
  const score = reviewed.reduce((sum, item) => sum + (item.achieved ?? 0), 0);
  const problems = [
    ...missingTopics.map((item) => 'Missing topic from the supplied brief: ' + item),
    ...(stuffing ? ['Potential keyword stuffing: the exact query appears ' + phrases + ' times and accounts for over 8% of the prose words.'] : []),
    ...(repeats ? [repeats + ' repeated substantive sentence(s).'] : []),
    ...filler.slice(0, 3).map((line) => 'Generic phrasing: ' + line.trim().slice(0, 160)),
    ...unrelated.slice(0, 3).map((line) => 'Weak query-term connection; review relevance: ' + line.trim().slice(0, 160)),
    ...unsupported.slice(0, 4).map((line) => 'Potentially unsupported claim: ' + line.trim().slice(0, 160)),
    ...[...contradictions].slice(0, 3).map((line) => 'Potential contradiction: ' + line.slice(0, 160)),
    ...stale.slice(0, 3).map((line) => 'Review freshness: ' + line.slice(0, 160)),
    ...(!cleanHierarchy ? ['Heading hierarchy skips a level or uses multiple H1 headings.'] : []),
  ];
  const recommendations = [...new Set(reviewed.flatMap((item) => item.rules.filter((criterion) => !criterion.met)).sort((a, b) => b.points - a.points).map((criterion) => criterion.improvement))].slice(0, 10);
  const strengths = [
    ...(directOpening ? ["The opening establishes the focus topic in a concise passage."] : []),
    ...(usefulActions.length >= 2 ? ["The draft contains " + usefulActions.length + " distinct instruction-like sentences."] : []),
    ...(evidence.length ? ["The draft includes an on-topic example signal."] : []),
    ...(comparison ? ["Relevant prose mentions a comparison or trade-off."] : []),
    ...(attributed ? ["The draft explicitly attributes at least one linked reference."] : []),
    ...(answerPairs.some(({ useful }) => useful) ? ["At least one question heading is followed by an on-topic answer passage."] : []),
  ];
  const verdict = unsupported.length || contradictions.size || stale.length
    ? "Review claims, contradictions, or time-sensitive information before publishing."
    : evaluated < 75 || score < 70
      ? "Revise the priority items and fill evidence gaps before publishing."
      : "Ready for final editorial review. Confirm intent, accuracy, sources, and publication requirements.";
  return {
    version: 1 as const, settings, score, evaluated, classification: classify(score), intent, aiWording,
    intentSource: settings.intent ? "selected" : intent ? "inferred" : "unclear",
    assessment: 'Earned ' + score + ' points from ' + evaluated + ' evaluated points in the 100-point rubric.',
    categories: reviewed, problems, recommendations, strengths, verdict,
    opportunities: {
      subtopics: missingTopics,
      entities: missingEntities,
      questions: [...answerPairs.filter((pair) => !pair.useful).map((pair) => pair.text), ...missingTopics.slice(0, 3).map((item) => 'What should a reader know about ' + item + '?')],
      terms: missingSecondary,
      needsBrief: gaps,
    },
  };
}
