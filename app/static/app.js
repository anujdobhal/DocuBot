const state = { chunks: [] };

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadHealth() {
  const data = await api("/api/health");
  document.querySelector("#health").textContent = "Qdrant: Online";
  document.querySelector("#vectorSize").textContent = data.vector_size;
}

async function loadDocuments() {
  const data = await api("/api/documents");
  document.querySelector("#documentCount").textContent = data.count;
}

async function loadChunks() {
  const data = await api("/api/chunks?limit=1000");
  state.chunks = data.items;
  document.querySelector("#chunkCount").textContent = data.total_chunks;
  renderChunks();
}

function renderChunks() {
  const filter = document.querySelector("#searchInput").value.toLowerCase();
  const rows = state.chunks.filter(c =>
    `${c.filename || ""} ${c.text || ""}`.toLowerCase().includes(filter)
  );

  const tbody = document.querySelector("#chunkTable");
  tbody.innerHTML = rows.map(c => `
    <tr>
      <td>${escapeHtml(c.filename || "")}</td>
      <td>${Number(c.chunk_index) + 1}</td>
      <td class="text-cell">${escapeHtml(c.text || "")}</td>
      <td>${formatDate(c.created_at)}</td>
      <td>
        <button class="delete-btn" onclick="deleteDocument('${c.document_id}')">
          Delete document
        </button>
      </td>
    </tr>
  `).join("");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5">No chunks found.</td></tr>`;
  }
}

async function deleteDocument(documentId) {
  if (!confirm("Delete this document and all of its chunks?")) return;

  try {
    await api(`/api/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
    await refresh();
  } catch (error) {
    alert(error.message);
  }
}

document.querySelector("#uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const input = document.querySelector("#fileInput");
  const status = document.querySelector("#uploadStatus");
  const file = input.files[0];

  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  status.textContent = "Extracting text, chunking and generating embeddings...";

  try {
    const result = await api("/api/documents/upload", {
      method: "POST",
      body: formData
    });

    status.textContent = `${result.filename}: ${result.chunk_count} chunks stored successfully.`;
    input.value = "";
    await refresh();
  } catch (error) {
    status.textContent = error.message;
  }
});

document.querySelector("#searchInput").addEventListener("input", renderChunks);
document.querySelector("#refreshBtn").addEventListener("click", refresh);

async function refresh() {
  try {
    await Promise.all([loadHealth(), loadDocuments(), loadChunks()]);
  } catch (error) {
    document.querySelector("#health").textContent = "Backend error";
    console.error(error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

refresh();
