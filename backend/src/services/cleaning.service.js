export function cleanText(rawText) {
  if (!rawText) return "";

  let text = rawText;

  // Fix common encoding artifacts (like Â© from bad character encoding)
  text = text.replace(/Â/g, "");

  // Normalize line breaks
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Collapse 3+ blank lines into max 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // Remove trailing spaces at end of lines
  text = text.replace(/[ \t]+\n/g, "\n");

  // Collapse multiple spaces/tabs into one space
  text = text.replace(/[ \t]{2,}/g, " ");

  // Trim overall
  text = text.trim();

  return text;
}

export function validateExtractedText(text) {
  const cleaned = text?.trim();
  if (!cleaned || cleaned.length === 0) {
    throw new Error("EMPTY_DOCUMENT: No extractable text found");
  }
  if (cleaned.length < 20) {
    throw new Error("DOCUMENT_TOO_SHORT: Extracted text is too short to be meaningful");
  }
  return cleaned;
}