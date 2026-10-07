import mammoth from "mammoth";
import path from "path";

/**
 * Extracts raw textual content from uploaded file buffers (.pdf, .docx, .txt)
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name with extension
 * @param {string} mimetype - File mimetype
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromFile(buffer, originalname = "", mimetype = "") {
  const ext = path.extname(originalname).toLowerCase();

  if (ext === ".txt" || mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (ext === ".docx" || mimetype.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (ext === ".pdf" || mimetype === "application/pdf") {
    try {
      const pdfParseModule = await import("pdf-parse");
      // Check if v2 class or v1 function
      if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse(new Uint8Array(buffer));
        const res = await parser.getText();
        if (typeof res === "string") return res;
        if (res && typeof res.text === "string") return res.text;
        if (res && Array.isArray(res.pages)) {
          return res.pages.map((p) => p.text || "").join("\n\n");
        }
        return String(res || "");
      } else if (typeof pdfParseModule.default === "function") {
        const data = await pdfParseModule.default(buffer);
        return data.text || "";
      } else {
        throw new Error("Unsupported pdf-parse export");
      }
    } catch (err) {
      console.warn("PDF extraction error:", err.message);
      // Fallback: try regex search for raw text streams if pdf-parse failed
      const rawStr = buffer.toString("binary");
      const textMatches = rawStr.match(/\(([^()]{3,})\)Tj/g);
      if (textMatches && textMatches.length > 5) {
        return textMatches.map((m) => m.slice(1, -3)).join(" ");
      }
      throw new Error(`Failed to extract text from PDF: ${err.message}`);
    }
  }

  throw new Error(`UNSUPPORTED_FILE_TYPE: File type '${ext || mimetype}' is not supported. Use .pdf, .docx, or .txt`);
}
