import collegeKnowledge from '../data/collegeKnowledge.json';

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'to', 'of',
  'what', 'how', 'when', 'where', 'who', 'why', 'can', 'you', 'tell', 'me', 'about',
  'give', 'please', 'i', 'want', 'know', 'are', 'with', 'from', 'this', 'that', 'do'
]);

/**
 * Searches local university documents for relevant excerpts to ground LLM responses
 * @param {string} query
 * @param {number} topK
 * @returns {{ contextText: string, sources: Array<{ title: string, docName: string, page: number, snippet: string }> }}
 */
export function retrieveContext(query, topK = 2) {
  if (!query || typeof query !== 'string') {
    return { contextText: '', sources: [] };
  }

  // Tokenize & normalize query terms
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  if (terms.length === 0) {
    return { contextText: '', sources: [] };
  }

  const scoredDocs = [];

  for (const doc of collegeKnowledge) {
    let score = 0;
    const titleLower = (doc.title || '').toLowerCase();
    const categoryLower = (doc.category || '').toLowerCase();
    const deptLower = (doc.department || '').toLowerCase();
    const contentLower = (doc.content || '').toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) score += 5;
      if (categoryLower.includes(term)) score += 4;
      if (deptLower.includes(term)) score += 3;
      if (contentLower.includes(term)) score += 1;
    }

    if (score >= 4) {
      scoredDocs.push({ doc, score });
    }
  }

  scoredDocs.sort((a, b) => b.score - a.score);
  const topMatches = scoredDocs.slice(0, topK);

  if (topMatches.length === 0) {
    return { contextText: '', sources: [] };
  }

  const sources = topMatches.map(({ doc }) => {
    // Generate an informative snippet from the content
    const snippetClean = (doc.content || '')
      .replace(/\s+/g, ' ')
      .trim();
    const snippet = snippetClean.length > 220
      ? snippetClean.slice(0, 220) + '...'
      : snippetClean;

    return {
      title: doc.title,
      docName: doc.fileName || `${doc.category}_document.pdf`,
      page: 1,
      snippet: snippet || 'Official Graphic Era Hill University document record.',
      url: doc.url || undefined,
    };
  });

  const contextText = topMatches
    .map(({ doc }) => `[Document: ${doc.title} (${doc.category})]\n${doc.content.slice(0, 500)}`)
    .join('\n\n');

  return { contextText, sources };
}
