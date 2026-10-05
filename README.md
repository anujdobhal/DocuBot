# College RAG Assistant & Admin Portal - Frontend

A modern, responsive, and secure frontend built with React, Vite, and Tailwind CSS for the College Retrieval-Augmented Generation (RAG) Chatbot project.

This frontend interfaces cleanly with a Node.js backend to provide:
1. **Public Student Chatbot**: An intuitive assistant where students can query college academic regulations, syllabus topics, and fee structures with verified citations and source documents.
2. **Admin Management Portal**: A dashboard for college administrators to upload documents (PDF, DOCX, TXT), monitor asynchronous chunking and vector ingestion statuses, reprocess documents, and inspect metadata.

---

## 1. What the Frontend Does

- **Student Knowledge Assistant**: Enables students to submit independent academic questions and receive generated answers along with exact citations (document name, page number, excerpt).
- **Admin Authentication**: Secures the administration portal via JWT session tokens without storing sensitive user passwords.
- **Document Management**: Displays document metrics (Total, Completed, Processing, Failed), with real-time status badges, chunk counts, search filtering, and pagination.
- **Document Ingestion**: Facilitates drag-and-drop file uploads with client-side validation for file types (`.pdf`, `.docx`, `.txt`) and file size limits (25MB).
- **Document Actions**: Supports inspection of ingestion times and error logs, reprocessing failed documents, refreshing status, and explicit confirmation before deletion.
- **Strict Boundary Separation**: Zero direct contact with vector databases (Qdrant) or LLMs. All interactions flow exclusively through standard REST endpoints exposed by the Node.js backend.

---

## 2. Installation

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed.

```bash
# Navigate to the frontend project folder
cd major_project

# Install dependencies
npm install
```

---

## 3. How to Run the Frontend

### Development Mode
```bash
npm run dev
```
The application will start on `http://localhost:3000` (or the port specified by Vite). Vite is configured with a development proxy that routes all `/api` requests directly to `http://localhost:5000`.

---

## 4. Required Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | Base path/URL for the backend REST API endpoints. |
| `VITE_USE_MOCK_FALLBACK` | `false` | When set to `true`, enables offline mock responses for previewing and testing UI states without running the backend server. |

---

## 5. Backend API URL Configuration

The frontend connects to the backend through a centralized API service in `src/services/api.js`.

- In **local development**, Vite automatically proxies requests from `/api` to the backend running at `http://localhost:5000` (configured in `vite.config.js`).
- In **production**, set `VITE_API_BASE_URL` in `.env.production` to your deployed backend URL (e.g., `https://api.yourcollege.edu/api`).

---

## 6. Available Pages & Routes

| Route | Access | Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Public | `Chatbot.jsx` | User-facing college assistant with auto-scroll and source citations. |
| `/login` | Public | `Login.jsx` | Admin authentication with loading state and client validation. |
| `/admin/dashboard` | Protected (Admin) | `Dashboard.jsx` | Ingestion statistics cards, recent files, and quick upload link. |
| `/admin/documents` | Protected (Admin) | `Documents.jsx` | Document table with search, pagination, details modal, and actions. |
| `/admin/upload` | Protected (Admin) | `Upload.jsx` | Drag-and-drop document upload with format guidance. |

---

## 7. Authentication Flow

1. The admin visits `/login` and provides credentials (email/username and password).
2. The form validates that fields are non-empty before dispatching `POST /api/auth/login`.
3. Upon receiving a successful response (`{ token, user }`), the JWT token is saved in `localStorage` under `college_rag_auth_token`.
4. Subsequent protected API calls automatically attach `Authorization: Bearer <token>` in request headers.
5. All `/admin/*` routes are wrapped by `ProtectedRoute`. Unauthenticated users are redirected to `/login`.
6. If the backend returns a `401 Unauthorized` or `403 Forbidden` status (expired session), the API interceptor clears local credentials and redirects to `/login` with an expiration notice: *"Your session has expired. Please log in again."*
7. Logging out purges local tokens and notifies `POST /api/auth/logout`.

---

## 8. Document Management Flow

1. **Upload**: Administrator selects or drops a `.pdf`, `.docx`, or `.txt` file on `/admin/upload`. The frontend validates file type and file size (< 25MB).
2. **Ingestion Submission**: The frontend sends a multipart form request to `POST /api/documents/upload`. The UI displays a non-blocking progress state.
3. **Status Monitoring**: Documents appear in `/admin/documents` with a color-coded status badge:
   - `Completed` (Green): Vector indexing is finished; chunk count is displayed.
   - `Processing` (Yellow): Ingestion pipeline is currently parsing or embedding.
   - `Failed` (Red): Ingestion failed; reason is viewable in the Details modal.
   - `Pending` (Slate): Document is queued in backend processing queue.
4. **View Details**: Clicking the eye icon opens a modal with timestamps (upload date, processing start/end duration), chunks created, and error diagnostics.
5. **Reprocess**: Clicking the reprocess icon dispatches `POST /api/documents/:id/reprocess` to re-queue the document.
6. **Refresh Status**: Administrator can refresh individual document statuses or re-fetch the entire table.
7. **Deletion**: Clicking the trash icon triggers an explicit confirmation modal (`"Are you sure? This cannot be undone."`). Upon confirmation, it calls `DELETE /api/documents/:id`.

---

## 9. Chatbot Flow

1. Student opens `/` and sees the welcome greeting: *"Ask me anything about our college documents."*
2. Student can click a suggested question chip or enter a query in the message box.
3. Submitting the query sends `POST /api/chat` with `{ question: string }`.
4. The user question is immediately stacked into the session message stream and an animated processing indicator is shown. Duplicate submissions are disabled while awaiting response.
5. The backend queries the RAG system and responds with `{ answer: string, sources: [...] }`.
6. The frontend renders the answer safely (without `innerHTML`) and displays collapsible source cards below the answer (document title, page number, snippet).
7. The conversation smoothly auto-scrolls to the latest message.
8. *Per specifications*: Each question is answered independently. No client-side conversational memory is assumed.

---

## 10. Expected Backend APIs

The frontend's centralized API module (`src/services/api.js`) expects the following REST contracts from the teammate's Node.js backend:

### Authentication
- `POST /api/auth/login`
  - **Body**: `{ email: string, password: string }`
  - **Response**: `{ token: string, user: { id: string, name: string, email: string, role: string } }`
- `POST /api/auth/logout`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: true }`

### Document Management
- `GET /api/documents`
  - **Query params**: `?search=&page=&limit=`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ documents: Array<Document>, total: number, page: number, totalPages: number }` (or an array of documents)
- `POST /api/documents/upload`
  - **Body**: `FormData` with field `file`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ message: string, document: Document }`
- `GET /api/documents/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ document: Document }`
- `DELETE /api/documents/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: true, message: string }`
- `POST /api/documents/:id/reprocess`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ success: true, document: Document }`

### Dashboard
- `GET /api/dashboard/stats`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: `{ total: number, completed: number, processing: number, failed: number }`
  *(Note: If this endpoint is not implemented, the frontend will automatically calculate these counts from `GET /api/documents`)*

### Chatbot
- `POST /api/chat`
  - **Body**: `{ question: string }`
  - **Response**:
    ```json
    {
      "answer": "String response from LLM",
      "sources": [
        {
          "title": "College Academic Regulations 2026",
          "page": 18,
          "docName": "College_Academic_Regulations_2026.pdf",
          "snippet": "Section 4.2 Attendance Requirement..."
        }
      ]
    }
    ```

### Expected `Document` Object Structure
```json
{
  "id": "doc-uuid",
  "name": "Academic_Calendar_2026.pdf",
  "type": "pdf",
  "fileSize": 1048576,
  "uploadedAt": "2026-10-02T10:00:00Z",
  "uploadedBy": "Admin User",
  "status": "Completed", // "Pending" | "Processing" | "Completed" | "Failed"
  "chunkCount": 42,
  "processingStartTime": "2026-10-02T10:00:02Z",
  "processingEndTime": "2026-10-02T10:00:45Z",
  "errorMessage": null
}
```

---

## 11. Production Build

To compile and bundle the frontend for production:

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## Security Best Practices Followed
- **No Secrets in Source**: No LLM keys, database credentials, or vector DB secrets exist in frontend files.
- **No Direct Vector Database Connections**: The frontend only speaks with the Node.js backend.
- **XSS Protection**: Zero use of `dangerouslySetInnerHTML`. All user inputs, document titles, and AI-generated text are rendered safely via React JSX.
- **Password Safety**: Passwords are sent over HTTPS to the backend and never persisted in storage.
