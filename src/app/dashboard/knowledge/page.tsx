"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Upload,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  BookOpen,
  Globe,
  Loader2,
  FileText,
} from "lucide-react";

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  source: string;
  usage_count: number;
  enabled: boolean;
  created_at: string;
}

function getCurrentSiteId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("current_site_id") || "";
}

type ImportTab = "url" | "paste" | null;

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  version: number;
  source: string;
  changes_summary: string | null;
  content_length?: number;
  created_at: string;
}

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ question: "", answer: "", category: "general" });
  const [editEntry, setEditEntry] = useState({ question: "", answer: "", category: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importTab, setImportTab] = useState<ImportTab>(null);
  const [importUrl, setImportUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [urlImporting, setUrlImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const mdRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [latestDoc, setLatestDoc] = useState<KnowledgeDoc | null>(null);
  const [evolving, setEvolving] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(false);

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/knowledge?site_id=${getCurrentSiteId()}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries || []);
    }
  }, []);

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/knowledge/docs?site_id=${getCurrentSiteId()}`);
    if (res.ok) {
      const data = await res.json();
      setDocs(data.documents || []);
      setLatestDoc(data.latest || null);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchDocs();
  }, [fetchEntries, fetchDocs]);

  async function addEntry() {
    if (!newEntry.question || !newEntry.answer) return;
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: getCurrentSiteId(), entry: newEntry }),
    });
    if (res.ok) {
      setShowAdd(false);
      setNewEntry({ question: "", answer: "", category: "general" });
      fetchEntries();
    }
  }

  async function saveEdit(id: string) {
    await fetch("/api/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editEntry }),
    });
    setEditId(null);
    fetchEntries();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    fetchEntries();
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    const csvEntries: { question: string; answer: string; category?: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length >= 2) {
        csvEntries.push({ question: parts[0], answer: parts[1], category: parts[2] || "general" });
      }
    }

    if (csvEntries.length > 0) {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: getCurrentSiteId(), entries: csvEntries }),
      });
      alert(`Imported ${csvEntries.length} entries!`);
      fetchEntries();
    } else {
      alert("No entries found in CSV. Make sure format is: question,answer,category");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) return;
    setUrlImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/knowledge/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: getCurrentSiteId(), url: importUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Imported ${data.imported} Q&A entries!`);
        setImportUrl("");
        setImportTab(null);
        fetchEntries();
      } else {
        setImportError(data.error || "Failed to import. Try pasting the content instead.");
      }
    } catch {
      setImportError("Failed to reach the URL. If the document requires login, try pasting the content instead.");
    }
    setUrlImporting(false);
  }

  async function handlePasteImport() {
    if (!pasteText.trim() || pasteText.length < 50) {
      setImportError("Please paste at least 50 characters of content.");
      return;
    }
    setUrlImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/knowledge/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: getCurrentSiteId(), text: pasteText }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Extracted ${data.imported} Q&A entries!`);
        setPasteText("");
        setImportTab(null);
        fetchEntries();
      } else {
        setImportError(data.error || "Failed to extract Q&A pairs.");
      }
    } catch {
      setImportError("Failed to process text.");
    }
    setUrlImporting(false);
  }

  async function handleMdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("site_id", getCurrentSiteId());
    try {
      const res = await fetch("/api/knowledge/upload-doc", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchDocs();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Upload failed");
    }
    setImporting(false);
    if (mdRef.current) mdRef.current.value = "";
  }

  async function handleEvolve() {
    setEvolving(true);
    try {
      const res = await fetch("/api/knowledge/evolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: getCurrentSiteId() }),
      });
      const data = await res.json();
      if (res.ok && data.evolved) {
        alert(`Knowledge evolved to v${data.version}!\n\nChanges:\n${data.changes_summary}\n\nAnalyzed ${data.interactions_analyzed} conversations.`);
        fetchDocs();
      } else {
        alert(data.message || data.error || "Evolution failed");
      }
    } catch {
      alert("Evolution failed");
    }
    setEvolving(false);
  }

  async function deleteDoc() {
    try {
      const res = await fetch(
        `/api/knowledge/docs?site_id=${getCurrentSiteId()}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setConfirmDeleteDoc(false);
        setShowDoc(false);
        fetchDocs();
      }
    } catch {
      alert("Failed to delete document");
    }
  }

  const filtered = entries.filter(
    (e) =>
      e.question.toLowerCase().includes(search.toLowerCase()) ||
      e.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Knowledge Base</h2>
        <p className="text-muted-foreground mt-1">
          {entries.length} entries · Teach your AI how to answer
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {importing ? "Importing..." : "Upload CSV"}
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
        <button
          onClick={() => setImportTab(importTab === "url" ? null : "url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            importTab === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          <Globe className="w-4 h-4" />
          Import URL
        </button>
        <button
          onClick={() => setImportTab(importTab === "paste" ? null : "paste")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            importTab === "paste" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Text
        </button>
        <button
          onClick={() => mdRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
        >
          <FileText className="w-4 h-4" />
          {importing ? "Uploading..." : "Upload MD/TXT"}
        </button>
        <input ref={mdRef} type="file" accept=".md,.txt,.markdown" onChange={handleMdUpload} className="hidden" />
      </div>

      {/* Knowledge Document (Evolving MD) */}
      {latestDoc && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground text-sm">{latestDoc.title}</p>
                <p className="text-xs text-muted-foreground">
                  v{latestDoc.version} · {latestDoc.source === "auto_evolved" ? "Auto-evolved" : "Uploaded"} · {new Date(latestDoc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDeleteDoc(true)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDoc(!showDoc)}
                className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition-colors"
              >
                {showDoc ? "Hide" : "View"}
              </button>
              <button
                onClick={handleEvolve}
                disabled={evolving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {evolving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {evolving ? "Evolving..." : "Evolve Now"}
              </button>
            </div>
          </div>
          {latestDoc.changes_summary && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-3">
              Latest changes: {latestDoc.changes_summary}
            </p>
          )}
          {showDoc && (
            <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-auto max-h-96 whitespace-pre-wrap font-mono">
              {latestDoc.content}
            </pre>
          )}
          {docs.length > 1 && (
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Version history ({docs.length} versions)
              </summary>
              <div className="mt-2 space-y-1">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs text-muted-foreground py-1">
                    <span>v{d.version} — {d.source === "auto_evolved" ? "Auto-evolved" : "Uploaded"}</span>
                    <span>{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Delete Document Confirmation Dialog */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold text-foreground mb-2">Delete Document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this document and all its versions? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteDoc(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteDoc}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Panel */}
      {importTab && (
        <div className="bg-card border border-primary/30 rounded-xl p-6 mb-6">
          {importTab === "url" ? (
            <>
              <h3 className="font-semibold text-foreground mb-2">Import from URL</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste a public webpage URL. AI will extract Q&A pairs automatically.
                <br />
                <span className="text-xs text-warning">Note: Private docs (Feishu, Notion) require the link to be set to &quot;Anyone with link can view&quot;. If it fails, use &quot;Paste Text&quot; instead.</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setImportError(""); }}
                  placeholder="https://docs.google.com/document/d/... or any public URL"
                  className="flex-1 bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleUrlImport}
                  disabled={urlImporting || !importUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {urlImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {urlImporting ? "Extracting..." : "Import"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-foreground mb-2">Paste Document Content</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy the content from your document (Feishu, Notion, Google Docs, etc.) and paste it here. AI will extract Q&A pairs.
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value); setImportError(""); }}
                placeholder="Paste your FAQ content, product documentation, help center articles, or any text here..."
                rows={8}
                className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3"
              />
              <button
                onClick={handlePasteImport}
                disabled={urlImporting || pasteText.length < 50}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {urlImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {urlImporting ? "Extracting Q&A..." : "Extract Q&A Pairs"}
              </button>
            </>
          )}
          {importError && (
            <p className="text-sm text-destructive mt-3">{importError}</p>
          )}
          <div className="flex justify-end mt-3">
            <button onClick={() => { setImportTab(null); setImportError(""); }} className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search knowledge base..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Add New Entry Form */}
      {showAdd && (
        <div className="bg-card border border-primary/30 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">New Entry</h3>
          <div className="space-y-3">
            <input
              value={newEntry.question}
              onChange={(e) => setNewEntry((p) => ({ ...p, question: e.target.value }))}
              placeholder="Question"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              value={newEntry.answer}
              onChange={(e) => setNewEntry((p) => ({ ...p, answer: e.target.value }))}
              placeholder="Answer"
              rows={3}
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <input
              value={newEntry.category}
              onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value }))}
              placeholder="Category (e.g. billing, technical)"
              className="w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={addEntry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {entries.length === 0
                ? "No knowledge entries yet. Add your first one or import a CSV."
                : "No entries match your search."}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-xl p-5">
              {editId === entry.id ? (
                <div className="space-y-3">
                  <input
                    value={editEntry.question}
                    onChange={(e) => setEditEntry((p) => ({ ...p, question: e.target.value }))}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <textarea
                    value={editEntry.answer}
                    onChange={(e) => setEditEntry((p) => ({ ...p, answer: e.target.value }))}
                    rows={3}
                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="p-2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={() => saveEdit(entry.id)} className="p-2 text-success hover:text-success/80">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{entry.question}</p>
                    <p className="text-muted-foreground text-sm mt-1">{entry.answer}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded-md capitalize">{entry.category}</span>
                      <span className="px-2 py-0.5 bg-muted rounded-md">
                        {entry.source === "csv_import" ? "CSV" : entry.source === "auto_learned" ? "Learned" : "Manual"}
                      </span>
                      <span>Used {entry.usage_count}x</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button
                      onClick={() => { setEditId(entry.id); setEditEntry({ question: entry.question, answer: entry.answer, category: entry.category }); }}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
