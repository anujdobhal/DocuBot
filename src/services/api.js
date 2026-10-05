import { INITIAL_MOCK_DOCUMENTS, MOCK_CHAT_RESPONSES } from './mockData.js';

// Base API configuration from Vite environment variable
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

// Token storage key
const TOKEN_KEY = 'college_rag_auth_token';
const USER_KEY = 'college_rag_user';

// Session expiration callback subscribers
let sessionExpiredHandlers = [];

export function onSessionExpired(handler) {
  sessionExpiredHandlers.push(handler);
  return () => {
    sessionExpiredHandlers = sessionExpiredHandlers.filter((h) => h !== handler);
  };
}

function notifySessionExpired() {
  clearAuth();
  sessionExpiredHandlers.forEach((handler) => {
    try {
      handler();
    } catch (err) {
      console.error('Error in session expired handler:', err);
    }
  });
}

// Token helper functions
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving auth to storage:', e);
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Error clearing auth:', e);
  }
}

/**
 * Standard fetch wrapper with authentication header injection and unified error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...options.headers };

  // Attach token if present
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON content-type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle session expiration
    if (response.status === 401 || response.status === 403) {
      notifySessionExpired();
      const errorMsg = 'Your session has expired. Please log in again.';
      throw new Error(errorMsg);
    }

    // Try parsing JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // If it's a TypeError (e.g. Failed to fetch / backend offline)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Unable to connect to the backend server. Please check your connection or verify the backend is running.'
      );
    }
    throw error;
  }
}

// -------------------------------------------------------------
// In-Memory Mock Store (used ONLY when VITE_USE_MOCK_FALLBACK=true)
// -------------------------------------------------------------
let mockDocuments = [...INITIAL_MOCK_DOCUMENTS];

// -------------------------------------------------------------
// Centralized API Service Methods
// -------------------------------------------------------------

export const api = {
  /**
   * Admin Login
   * @param {string} emailOrUsername
   * @param {string} password
   */
  async login(emailOrUsername, password) {
    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for login.');
      await new Promise((r) => setTimeout(r, 600));

      if (password === 'wrong') {
        throw new Error('Invalid credentials. Please verify your email and password.');
      }

      const mockToken = 'mock-jwt-token-' + Date.now();
      const mockUser = {
        id: 'usr-admin-1',
        name: emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername,
        email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@college.edu`,
        role: 'admin',
      };
      setAuth(mockToken, mockUser);
      return { token: mockToken, user: mockUser };
    }

    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailOrUsername, password }),
    });

    // Save token and user
    if (data.token) {
      setAuth(data.token, data.user || { email: emailOrUsername, role: 'admin' });
    }
    return data;
  },

  /**
   * Admin Logout
   */
  async logout() {
    try {
      if (!USE_MOCK_FALLBACK) {
        await request('/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      // Ignore network failures on logout
      console.warn('Backend logout notification failed, clearing local session:', e.message);
    } finally {
      clearAuth();
    }
  },

  /**
   * Get all documents with optional search & pagination
   * @param {Object} params { search, page, limit }
   */
  async getDocuments(params = {}) {
    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for getDocuments.');
      await new Promise((r) => setTimeout(r, 400));

      let filtered = [...mockDocuments];
      if (params.search) {
        const query = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (doc) =>
            doc.name.toLowerCase().includes(query) ||
            doc.uploadedBy.toLowerCase().includes(query)
        );
      }

      return {
        documents: filtered,
        total: filtered.length,
        page: params.page || 1,
        totalPages: Math.ceil(filtered.length / (params.limit || 10)) || 1,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;
    const response = await request(endpoint, { method: 'GET' });

    // Handle both array response or object { documents: [...] }
    if (Array.isArray(response)) {
      return { documents: response, total: response.length, page: 1, totalPages: 1 };
    }
    return response;
  },

  /**
   * Get single document details
   * @param {string} id
   */
  async getDocument(id) {
    if (USE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 300));
      const doc = mockDocuments.find((d) => d.id === id);
      if (!doc) throw new Error('Document not found.');
      return { document: doc };
    }

    return await request(`/documents/${id}`, { method: 'GET' });
  },

  /**
   * Upload a new document (PDF, DOCX, TXT)
   * @param {File} file
   * @param {Function} onProgress
   */
  async uploadDocument(file) {
    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for uploadDocument.');
      await new Promise((r) => setTimeout(r, 1200));

      const ext = file.name.split('.').pop().toLowerCase();
      const newDoc = {
        id: 'doc-' + Date.now(),
        name: file.name,
        type: ext,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: getStoredUser()?.name || 'Admin',
        status: 'Processing',
        chunkCount: null,
        processingStartTime: new Date().toISOString(),
        processingEndTime: null,
        errorMessage: null,
      };

      // Add to front of mock list
      mockDocuments = [newDoc, ...mockDocuments];

      // Simulate asynchronous completion after 5 seconds in mock mode
      setTimeout(() => {
        const item = mockDocuments.find((d) => d.id === newDoc.id);
        if (item) {
          item.status = 'Completed';
          item.chunkCount = Math.floor(Math.random() * 80) + 20;
          item.processingEndTime = new Date().toISOString();
        }
      }, 5000);

      return {
        message: 'File uploaded successfully and queued for processing.',
        document: newDoc,
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    return await request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Delete a document
   * @param {string} id
   */
  async deleteDocument(id) {
    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for deleteDocument.');
      await new Promise((r) => setTimeout(r, 500));
      mockDocuments = mockDocuments.filter((d) => d.id !== id);
      return { success: true, message: 'Document deleted successfully.' };
    }

    return await request(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reprocess a document
   * @param {string} id
   */
  async reprocessDocument(id) {
    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for reprocessDocument.');
      await new Promise((r) => setTimeout(r, 500));
      const doc = mockDocuments.find((d) => d.id === id);
      if (!doc) throw new Error('Document not found');
      doc.status = 'Processing';
      doc.errorMessage = null;
      doc.processingStartTime = new Date().toISOString();
      doc.processingEndTime = null;

      // Mock completion
      setTimeout(() => {
        if (doc) {
          doc.status = 'Completed';
          doc.chunkCount = Math.floor(Math.random() * 80) + 30;
          doc.processingEndTime = new Date().toISOString();
        }
      }, 4000);

      return { success: true, document: doc };
    }

    return await request(`/documents/${id}/reprocess`, {
      method: 'POST',
    });
  },

  /**
   * Refresh a document's latest status
   * @param {string} id
   */
  async refreshDocumentStatus(id) {
    return await this.getDocument(id);
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    if (USE_MOCK_FALLBACK) {
      await new Promise((r) => setTimeout(r, 300));
      const total = mockDocuments.length;
      const completed = mockDocuments.filter((d) => d.status === 'Completed').length;
      const processing = mockDocuments.filter((d) => d.status === 'Processing').length;
      const failed = mockDocuments.filter((d) => d.status === 'Failed').length;
      return { total, completed, processing, failed };
    }

    try {
      // Try dedicated stats endpoint if implemented by backend
      return await request('/dashboard/stats', { method: 'GET' });
    } catch {
      // Fallback: Compute stats from getDocuments if dedicated /stats is not available
      const data = await this.getDocuments();
      const list = data.documents || [];
      return {
        total: list.length,
        completed: list.filter((d) => d.status === 'Completed').length,
        processing: list.filter((d) => d.status === 'Processing').length,
        failed: list.filter((d) => d.status === 'Failed').length,
      };
    }
  },

  /**
   * Submit a question to the Chatbot RAG pipeline
   * @param {string} question
   */
  async askQuestion(question) {
    if (!question || !question.trim()) {
      throw new Error('Please enter a valid question.');
    }

    if (USE_MOCK_FALLBACK) {
      console.warn('[API Service] Using mock fallback for askQuestion.');
      await new Promise((r) => setTimeout(r, 1000));

      const qLower = question.toLowerCase();
      const matched = MOCK_CHAT_RESPONSES.find((item) =>
        item.keywords.some((kw) => qLower.includes(kw))
      );

      if (matched) {
        return {
          answer: matched.answer,
          sources: matched.sources,
        };
      }

      return {
        answer: `Based on the college documents in our repository, here is the relevant information regarding "${question}":\n\nPlease refer to the official college handbook or contact the administrative office for specific inquiries outside the published academic regulations.`,
        sources: [
          {
            title: 'General College Information Bulletin',
            page: 1,
            docName: 'College_Academic_Regulations_2026.pdf',
            snippet: 'Official publications of the Office of the Registrar and Academic Affairs.',
          },
        ],
      };
    }

    return await request('/chat', {
      method: 'POST',
      body: JSON.stringify({ question: question.trim() }),
    });
  },
};
