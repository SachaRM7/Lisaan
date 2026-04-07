import { useState, useCallback, useRef } from "react";

const STYLES = {
  app: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e4df",
    fontFamily: "'Newsreader', 'Georgia', serif",
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed",
    inset: 0,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "48px 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
    display: "block",
    opacity: 0.7,
  },
  title: {
    fontSize: 42,
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    margin: 0,
    background: "linear-gradient(135deg, #e8e4df 0%, #a89f94 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b6560",
    marginTop: 10,
    fontStyle: "italic",
    fontWeight: 300,
  },
};

export default function LecteurNotes() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const fileRef = useRef();

  const addImages = useCallback((files) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    validFiles.forEach((file) => {
      const id = Date.now() + Math.random();
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1];
        const mediaType = file.type;
        setImages((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            preview: e.target.result,
            base64,
            mediaType,
          },
        ]);
        processImage(id, base64, mediaType);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const processImage = async (id, base64, mediaType) => {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: `Tu es un expert en lecture d'écriture manuscrite, même difficile à lire. 
Transcris TOUT le texte visible sur cette image, aussi fidèlement que possible.
- Respecte les sauts de ligne et la structure du texte original.
- Si un mot est illisible, écris [illisible] à sa place.
- Si tu hésites entre deux lectures, choisis la plus probable.
- Ne commente pas, ne résume pas : donne uniquement la transcription brute.`,
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content
        ?.map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");
      setResults((r) => ({
        ...r,
        [id]: text || "Aucun texte détecté.",
      }));
    } catch (err) {
      setResults((r) => ({
        ...r,
        [id]: `Erreur : ${err.message}`,
      }));
    }
    setProcessing((p) => ({ ...p, [id]: false }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addImages(e.dataTransfer.files);
  };

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setResults((r) => {
      const copy = { ...r };
      delete copy[id];
      return copy;
    });
    setProcessing((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });
  };

  const retryImage = (img) => {
    setResults((r) => {
      const copy = { ...r };
      delete copy[img.id];
      return copy;
    });
    processImage(img.id, img.base64, img.mediaType);
  };

  return (
    <div style={STYLES.app}>
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,600;1,6..72,300;1,6..72,400&family=JetBrains+Mono:wght@300;400&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .drop-zone { transition: all 0.3s ease; }
        .drop-zone:hover { border-color: #a89f94 !important; background: rgba(168,159,148,0.04) !important; }
        .card { animation: fadeUp 0.5s ease both; }
        .copy-btn { transition: all 0.2s ease; }
        .copy-btn:hover { background: rgba(168,159,148,0.15) !important; }
        .remove-btn { transition: all 0.15s ease; }
        .remove-btn:hover { background: rgba(220,80,60,0.15) !important; color: #dc503c !important; }
        .retry-btn { transition: all 0.15s ease; }
        .retry-btn:hover { background: rgba(168,159,148,0.15) !important; }
        * { box-sizing: border-box; }
        ::selection { background: rgba(168,159,148,0.3); }
      `}</style>
      <div style={STYLES.grain} />
      <div style={STYLES.container}>
        <header style={STYLES.header}>
          <span style={STYLES.icon}>✒️</span>
          <h1 style={STYLES.title}>Lecteur de Notes</h1>
          <p style={STYLES.subtitle}>
            Dépose tes photos de notes manuscrites — même illisibles
          </p>
        </header>

        {/* Drop Zone */}
        <div
          className="drop-zone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? "#a89f94" : "#2a2824"}`,
            borderRadius: 16,
            padding: "44px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver
              ? "rgba(168,159,148,0.06)"
              : "rgba(255,255,255,0.015)",
            marginBottom: 40,
            transition: "all 0.3s ease",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addImages(e.target.files)}
          />
          <div
            style={{ fontSize: 32, marginBottom: 10, opacity: dragOver ? 1 : 0.5 }}
          >
            📷
          </div>
          <div style={{ fontSize: 17, color: "#a89f94", fontWeight: 300 }}>
            {dragOver
              ? "Lâche ici !"
              : "Clique ou glisse tes photos ici"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#4a4540",
              marginTop: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 300,
            }}
          >
            JPG · PNG · WEBP — plusieurs fichiers OK
          </div>
        </div>

        {/* Results */}
        {images.map((img, i) => (
          <div
            className="card"
            key={img.id}
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid #1e1c18",
              borderRadius: 14,
              marginBottom: 20,
              overflow: "hidden",
              animationDelay: `${i * 0.08}s`,
            }}
          >
            {/* Image header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderBottom: "1px solid #1a1815",
              }}
            >
              <img
                src={img.preview}
                alt=""
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #2a2824",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 300,
                    color: "#a89f94",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {img.name}
                </div>
                <div style={{ fontSize: 12, color: "#4a4540", marginTop: 2 }}>
                  {processing[img.id]
                    ? "Lecture en cours…"
                    : results[img.id]
                    ? "Transcription terminée"
                    : "En attente"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {results[img.id] && !processing[img.id] && (
                  <button
                    className="retry-btn"
                    onClick={() => retryImage(img)}
                    title="Relire"
                    style={{
                      background: "transparent",
                      border: "1px solid #2a2824",
                      borderRadius: 8,
                      color: "#6b6560",
                      cursor: "pointer",
                      padding: "6px 8px",
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                  >
                    ↻
                  </button>
                )}
                <button
                  className="remove-btn"
                  onClick={() => removeImage(img.id)}
                  title="Supprimer"
                  style={{
                    background: "transparent",
                    border: "1px solid #2a2824",
                    borderRadius: 8,
                    color: "#4a4540",
                    cursor: "pointer",
                    padding: "6px 8px",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content area */}
            <div style={{ padding: "18px 20px" }}>
              {processing[img.id] ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[90, 70, 50].map((w, j) => (
                    <div
                      key={j}
                      style={{
                        height: 14,
                        width: `${w}%`,
                        borderRadius: 6,
                        background:
                          "linear-gradient(90deg, #1a1815 25%, #2a2824 50%, #1a1815 75%)",
                        backgroundSize: "200% 100%",
                        animation: `shimmer 1.8s ease infinite`,
                        animationDelay: `${j * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              ) : results[img.id] ? (
                <>
                  <pre
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13.5,
                      lineHeight: 1.7,
                      fontWeight: 300,
                      color: "#d4d0ca",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {results[img.id]}
                  </pre>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 14,
                    }}
                  >
                    <button
                      className="copy-btn"
                      onClick={() => copyText(img.id, results[img.id])}
                      style={{
                        background: "rgba(168,159,148,0.08)",
                        border: "1px solid #2a2824",
                        borderRadius: 8,
                        color:
                          copiedId === img.id ? "#7a9f6a" : "#a89f94",
                        cursor: "pointer",
                        padding: "8px 16px",
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 300,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {copiedId === img.id ? "✓ Copié" : "⎘ Copier le texte"}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {images.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#3a3530",
              fontSize: 15,
              fontStyle: "italic",
              padding: "20px 0 60px",
            }}
          >
            Tes transcriptions apparaîtront ici
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: 12,
            color: "#2a2520",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 300,
          }}
        >
          Propulsé par Claude · 100% gratuit
        </div>
      </div>
    </div>
  );
}
