export const contentLimit = 100_000;

const wordPattern = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu;
const urlPattern = /https?:\/\/[^\s<>)\]]+/gi;
const stopWords = new Set((
  "a about above after all also an and any are as at be because been before both but by can could did do does each " +
  "else even for from get had has have here how i if in include into is it its just may more most much must no not " +
  "of on one or other our out over should so some start such than that the their them then there these they this those " +
  "through to too under up use using very was we were what when where which while who why will with would you your reader readers " +
  "hai hain tha ke ka ki ko se par bhi aur ek ye yeh wo jo kya mein liye kar " +
  "है हैं था के का की को से पर भी और एक यह ये वह जो क्या में लिए कर तथा या दिए द्वारा"
).split(/\s+/));
const firstHand = /\b(?:we|i|our team)\s+(?:tested|measured|observed|compared|interviewed|implemented|used|ran|visited|surveyed)\b|\bin (?:our|my) (?:test|study|experience|practice)\b|(?:हमने|मैंने)/iu;
const concrete = /\p{N}|\b(?:for example|for instance|case study|worked example|trade-off|limitation|benchmark)\b|(?:उदाहरण|तुलना)/iu;
const attribution = /\b(?:according to|published by|reported by|study by|research by|documentation)\b|\bsource\s*:|(?:के अनुसार|स्रोत)/iu;
const claim = /\p{N}+(?:[.,]\p{N}+)?\s*(?:%|percent\b|times (?:faster|more)\b)|\b(?:guaranteed|never fails|risk[- ]free|proven to|always works)\b|(?:गारंटी|प्रतिशत)/iu;
const absolute = /\b(?:guaranteed|never fails|risk[- ]free|always works|100% effective)\b|(?:गारंटी)/iu;
const explanation = /\b(?:because|therefore|which means|depends on|works by|results in|leads to|so that|helps|whereas|unless)\b|(?:क्योंकि|इसलिए|निर्भर|जिससे)/iu;
const action = /\b(?:check|compare|choose|measure|record|test|calculate|review|verify|apply|set|add|remove|start|track|adjust|install|try|use)\b|(?:जाँच|तुलना|चुनें|करें)/iu;
const answer = /\b(?:is|are|means|provides?|carries|carry|requires?|works?|consists?|can|helps?|allows?|includes?|supports?)\b|(?:है|हैं|करता|करती|होता|होती)/iu;

function words(value: string) {
  return value.normalize("NFKC").toLowerCase().match(wordPattern) ?? [];
}

function plainText(content: string) {
  return content.replace(/\r\n?/g, "\n")
    .replace(/^ {0,3}(\x60{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gm, "")
    .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)/gm, "")
    .replace(/^\s*(?:={3,}|-{3,})\s*$/gm, "")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .trim();
}

function isTopicWord(word: string) {
  return word.length > 1 && /\p{L}/u.test(word) && !stopWords.has(word);
}

function topicKey(word: string) {
  return /^[a-z]{4,}ies$/.test(word) ? word.slice(0, -3) + "y"
    : /^[a-z]{4,}[^s]s$/.test(word) ? word.slice(0, -1) : word;
}

function inferTopic(sentences: string[], source: string) {
  const counts = new Map<string, number>();
  const phrases = new Map<string, { tokens: string[]; mentions: number; first: number }>();
  sentences.forEach((sentence, index) => {
    const tokens = words(sentence);
    const meaningful = new Set(tokens.filter(isTopicWord).map(topicKey));
    for (const token of meaningful) counts.set(token, (counts.get(token) ?? 0) + 1);
    const seen = new Set<string>();
    for (let start = 0; start < tokens.length; start++) {
      for (let size = 1; size <= 5 && start + size <= tokens.length; size++) {
        const parts = tokens.slice(start, start + size);
        if (!isTopicWord(parts[0]) || !isTopicWord(parts[parts.length - 1])) continue;
        if (parts.slice(1, -1).some((word) => !isTopicWord(word) && !/^(?:for|of|in|and|ke|ka|ki|के|का|की|में)$/.test(word))) continue;
        const key = parts.map(topicKey).join(" ");
        if (seen.has(key)) continue;
        seen.add(key);
        const previous = phrases.get(key);
        phrases.set(key, { tokens: previous?.tokens ?? parts, mentions: (previous?.mentions ?? 0) + 1, first: previous?.first ?? index });
      }
    }
  });
  const candidates = [...phrases.values()].map(({ tokens, mentions, first }) => {
    const terms = tokens.filter(isTopicWord).map(topicKey);
    const coverage = terms.reduce((total, term) => total + (counts.get(term) ?? 0), 0) / terms.length;
    return { tokens, terms, weight: mentions * 2 + coverage * 2.5 + (first === 0 ? 2 : first === 1 ? 1 : 0)
      + (terms.length > 1 ? 5 : 0) + (terms.length > 1 && first === 0 ? 2 : 0)
      + (terms.length === 3 && (mentions > 1 || sentences.length === 1) ? 1 : 0) - Math.max(terms.length - 3, 0) * 2 };
  }).sort((a, b) => b.weight - a.weight);
  const best = candidates[0];
  const top = best?.terms.length === 1
    ? candidates.find((candidate) => candidate.terms.length > 1 && candidate.terms.includes(best.terms[0]) && candidate.weight >= best.weight - 3) ?? best
    : best;
  if (!top) return { label: "Topic unclear", terms: [] };
  const casing = new Map(
    (source.match(/\b[A-Z]{2,8}\b|(?<=\p{L} )\p{Lu}[\p{Ll}\p{M}]+/gu) ?? []).map((token) => [token.toLowerCase(), token]),
  );
  const label = top.tokens.map((token) => casing.get(token) ?? token).join(" ");
  return { label: label[0].toLocaleUpperCase() + label.slice(1), terms: top.terms };
}

function signal(label: string, points: number, found: boolean, evidence: string | undefined, suggestion: string) {
  return { label, points, earned: found ? points : 0, evidence: evidence?.trim().slice(0, 220), suggestion };
}

function assessment(label: string, signals: ReturnType<typeof signal>[]) {
  return { label, signals, score: signals.reduce((sum, item) => sum + item.earned, 0) };
}

export function evaluateContent(content: string) {
  const source = plainText(content);
  const parts = source.split(/(?<=[.!?।！？。])\s+|\n+/u).filter((part) => part.trim());
  const sentences = parts.map((part) => part.replace(urlPattern, "").trim()).filter((part) => /\p{L}/u.test(part));
  const totalWords = words(sentences.join(" ")).length;
  if (!totalWords) return null;

  const topic = inferTopic(sentences, source);
  const topical = (line: string) => {
    const tokens = new Set(words(line).map(topicKey));
    return topic.terms.some((word) => tokens.has(word));
  };
  const distinct = [...new Map(sentences.map((sentence) => [words(sentence).join(" "), sentence])).values()];
  const substantive = distinct.filter((sentence) => words(sentence).length >= 8 && !/[?？]$/.test(sentence));
  const practical = substantive.find((sentence) => action.test(sentence));
  const reasoned = substantive.find((sentence) => explanation.test(sentence));
  const experience = substantive.find((sentence) => firstHand.test(sentence));
  const documented = experience && (concrete.test(experience) || reasoned);
  const example = substantive.find((sentence) => concrete.test(sentence) && !absolute.test(sentence));
  const byline = source.match(/^(?:(?:written|reviewed|edited) by|author\s*:|लेखक\s*:)[ \t]*\p{L}[^\n]{1,140}/imu)?.[0];
  const credentials = byline && /\b(?:certified|licensed|engineer|researcher|specialist|professor|doctor|editor)\b/i.test(byline);
  const sourcePassage = parts.find((part) => part.search(urlPattern) >= 0 && attribution.test(part));
  const unlinkedClaim = parts.find((part, i) => {
    const next = parts[i + 1] ?? "";
    return claim.test(part.replace(urlPattern, "")) && part.search(urlPattern) < 0 &&
      !(next.search(urlPattern) >= 0 && attribution.test(next));
  });
  const overstatement = sentences.find((sentence) => absolute.test(sentence));
  const direct = sentences.slice(0, 3).find((sentence) => substantive.includes(sentence) && topical(sentence) &&
    (answer.test(sentence) || action.test(sentence)));
  const standAlone = substantive.filter((sentence) => topical(sentence) &&
    !/^(?:it|this|these|those|they|that|he|she|वह|यह|इससे)\b/iu.test(sentence));
  const consistent = substantive.length >= 2 && substantive.filter(topical).length >= Math.ceil(substantive.length / 2);

  return {
    topic: topic.label,
    wordCount: totalWords,
    eeat: assessment("E-E-A-T signals", [
      signal("Experience", 10, Boolean(experience), experience, "Describe relevant first-hand use, observation, or testing where you have it."),
      signal("Experience details", 10, Boolean(documented), documented ? experience : undefined, "Add a concrete detail about what you did and what you observed."),
      signal("Expertise", 15, Boolean(reasoned), reasoned, "Explain why the advice works and when it applies."),
      signal("Relevant credentials", 5, Boolean(credentials), credentials ? byline : undefined, "Include relevant author or reviewer credentials when available."),
      signal("Author attribution", 5, Boolean(byline), byline, "Name the author or reviewer where the draft is intended for publication."),
      signal("Source attribution", 15, Boolean(sourcePassage), sourcePassage, "Name a relevant source and link to it alongside the information it supports."),
      signal("Claim support", 25, Boolean(sourcePassage && !unlinkedClaim), unlinkedClaim ?? sourcePassage, "Support material claims with an attributable source and verify the figures."),
      signal("Measured language", 15, substantive.length >= 1 && !overstatement, overstatement, "Qualify sweeping claims and state the conditions or limitations."),
    ]),
    geo: assessment("Generative search readiness", [
      signal("Direct answer", 25, Boolean(direct), direct, "State the main answer or takeaway in the opening sentences."),
      signal("Standalone explanations", 20, standAlone.length >= 2, standAlone[1], "Name the subject in key answers so readers can understand them in isolation."),
      signal("Topic focus", 10, consistent, consistent ? standAlone[0] : undefined, "Keep the main explanations connected to the same topic."),
      signal("Useful specifics", 20, Boolean(example), example, "Add a useful example, measurement, comparison, or limitation."),
      signal("Practical detail", 15, Boolean(practical && reasoned), practical, "Give a practical next step and explain why or when it works."),
      signal("Verifiable or first-hand information", 10, Boolean(sourcePassage || documented), sourcePassage ?? (documented ? experience : undefined), "Add an attributable reference or documented first-hand insight."),
    ]),
  };
}

export type ContentAudit = NonNullable<ReturnType<typeof evaluateContent>>;
