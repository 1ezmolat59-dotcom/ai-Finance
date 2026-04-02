"use client";

import { useState, useRef } from "react";
import styles from "./CsvConverter.module.css";

export default function CsvConverter() {
  const [mode, setMode] = useState("image"); // "image" | "text"
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleConvert = async () => {
    setError("");
    setLoading(true);

    try {
      let body;
      let headers = {};

      if (mode === "image") {
        if (!file) { setError("Please select an image."); setLoading(false); return; }
        const fd = new FormData();
        fd.append("file", file);
        if (context) fd.append("context", context);
        body = fd;
      } else {
        if (!text.trim()) { setError("Please enter some data."); setLoading(false); return; }
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ text, context });
      }

      const res = await fetch("/api/convert-to-csv", { method: "POST", headers, body });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(err.error);
      }

      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>📊 Data → CSV Converter</div>
        <p className={styles.subtitle}>
          Upload a screenshot or paste structured data — AI extracts and converts it to CSV.
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === "image" ? styles.tabActive : ""}`}
          onClick={() => setMode("image")}
        >
          📷 Image / Screenshot
        </button>
        <button
          className={`${styles.tab} ${mode === "text" ? styles.tabActive : ""}`}
          onClick={() => setMode("text")}
        >
          📝 Paste Text / Table
        </button>
      </div>

      {mode === "image" ? (
        <div
          className={`${styles.dropZone} ${file ? styles.dropZoneActive : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f && f.type.startsWith("image/")) setFile(f);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          {file ? (
            <span className={styles.fileName}>✓ {file.name}</span>
          ) : (
            <>
              <span className={styles.dropIcon}>⬆️</span>
              <span>Drop image or click to browse</span>
              <span className={styles.dropHint}>PNG, JPG, WEBP supported</span>
            </>
          )}
        </div>
      ) : (
        <textarea
          className={styles.textarea}
          placeholder="Paste a table, bank statement, or any structured financial data here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
        />
      )}

      <input
        className={styles.contextInput}
        type="text"
        placeholder="Optional: add context (e.g. 'bank statement Jan 2025')"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />

      {error && <div className={styles.errorMsg}>{error}</div>}

      <button
        className={styles.convertBtn}
        onClick={handleConvert}
        disabled={loading}
      >
        {loading ? "Converting…" : "Convert to CSV ↓"}
      </button>
    </div>
  );
}
