import { retrieveContext } from './knowledgeRetriever.js';

const OLLAMA_PROXY_BASE = (import.meta.env.VITE_OLLAMA_URL || '/api/ollama').replace(/\/$/, '');
const DIRECT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2:1b';

/**
 * Service to interact directly with local Ollama running llama3.2:1b
 */
export const ollamaService = {
  activeModel: DEFAULT_MODEL,

  /**
   * Helper to perform fetch trying the Vite proxy first, and direct localhost fallback if proxy fails
   */
  async requestOllama(path, options = {}) {
    const proxyUrl = `${OLLAMA_PROXY_BASE}${path}`;
    try {
      const res = await fetch(proxyUrl, options);
      if (res.ok) return res;
      throw new Error(`Proxy responded with ${res.status}`);
    } catch (proxyErr) {
      // Try direct Ollama connection on localhost:11434
      const directUrl = `${DIRECT_OLLAMA_URL}/api${path.replace(/^\/api/, '')}`;
      try {
        const directRes = await fetch(directUrl, options);
        if (directRes.ok) return directRes;
        throw new Error(`Direct connection failed with ${directRes.status}`);
      } catch (directErr) {
        throw new Error(
          `Unable to connect to local Ollama. Please ensure Ollama is running on your machine ('ollama serve' or desktop app). Error: ${proxyErr.message}`
        );
      }
    }
  },

  /**
   * Check if local Ollama server is active and list available models
   */
  async checkHealth() {
    try {
      const res = await this.requestOllama('/tags', { method: 'GET' });
      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);
      
      const hasLlama32 = models.some((name) =>
        name.toLowerCase().includes('llama3.2:1b') || name.toLowerCase().includes('llama3.2')
      );

      return {
        online: true,
        models,
        hasModel: hasLlama32 || models.length > 0,
        modelName: hasLlama32 ? 'llama3.2:1b' : (models[0] || DEFAULT_MODEL),
      };
    } catch (err) {
      return {
        online: false,
        models: [],
        hasModel: false,
        error: err.message,
      };
    }
  },

  /**
   * Generate an answer using the local llama3.2:1b model with grounding context and optional streaming
   */
  async chat({ question, conversationHistory = [], onToken = null }) {
    if (!question || !question.trim()) {
      throw new Error('Please enter a valid question.');
    }

    const trimmedQuestion = question.trim();

    // 1. Retrieve grounded college context from local scraped dataset
    const { contextText, sources } = retrieveContext(trimmedQuestion);

    // 2. Build system instructions
    let systemInstruction =
      'You are DocuBot, the AI Assistant for Graphic Era Hill University (GEHU).\n' +
      'You are running locally on the user machine using the llama3.2:1b model.\n' +
      'Provide clear, concise, accurate, and helpful answers to students and faculty regarding college academics, syllabus, fee structure, hostel, exam schedules, and campus life.\n';

    if (contextText) {
      systemInstruction +=
        '\nGround your response in the following official college document excerpts:\n' +
        contextText +
        '\n\nMention specific names, dates, or guidelines from the documents when applicable.';
    } else {
      systemInstruction +=
        '\nIf the question is a greeting or general inquiry, reply warmly and politely as an intelligent college chatbot.';
    }

    // 3. Format previous messages for conversational continuity
    const messagesPayload = [
      { role: 'system', content: systemInstruction },
    ];

    // Include last few turns of dialogue
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        messagesPayload.push({ role: 'user', content: msg.text });
      } else if (msg.sender === 'assistant' && !msg.isError) {
        messagesPayload.push({ role: 'assistant', content: msg.text });
      }
    }

    messagesPayload.push({ role: 'user', content: trimmedQuestion });

    // 4. Send request to Ollama
    const payload = {
      model: this.activeModel,
      messages: messagesPayload,
      stream: typeof onToken === 'function',
      options: {
        temperature: 0.4,
        top_p: 0.9,
      },
    };

    const res = await this.requestOllama('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 5. Handle Streaming Response
    if (typeof onToken === 'function' && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              const chunk = parsed.message.content;
              fullText += chunk;
              onToken(chunk, fullText);
            }
          } catch {
            // Ignore partial parse failures
          }
        }
      }

      return {
        answer: fullText.trim() || 'No answer generated.',
        sources,
        model: this.activeModel,
      };
    }

    // 6. Handle Non-streaming Response
    const data = await res.json();
    const answer =
      data.message?.content ||
      data.response ||
      'No answer generated by the model.';

    return {
      answer: answer.trim(),
      sources,
      model: this.activeModel,
    };
  },
};
