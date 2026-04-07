"use client";

import { useState, useRef, useCallback } from "react";

interface Candidate {
  type: string;
  label: string;
  kanji: string;
  reading: string;
  meaning: string;
  concept: string;
  description: string;
}

const TYPE_ICONS: Record<string, string> = {
  簡潔型: "一",
  忠実型: "音",
  バランス型: "和",
  詩的型: "華",
};

const TYPE_SUBTITLES: Record<string, string> = {
  簡潔型: "簡潔 · Essence in simplicity",
  忠実型: "忠実 · True to your sound",
  バランス型: "調和 · Harmony of form",
  詩的型: "詩的 · Art of expression",
};

export default function Home() {
  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    setCandidates([]);
    setSelected(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setCandidates(data.candidates);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [name]);

  const downloadCard = useCallback(() => {
    if (selected === null || !canvasRef.current) return;
    const candidate = candidates[selected];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 1200;
    const h = 1600;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Decorative border
    const borderGrad = ctx.createLinearGradient(0, 0, w, h);
    borderGrad.addColorStop(0, "#b8860b");
    borderGrad.addColorStop(0.5, "#f0d68a");
    borderGrad.addColorStop(1, "#b8860b");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Inner border
    ctx.strokeStyle = "rgba(212, 168, 67, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(55, 55, w - 110, h - 110);

    // Corner ornaments
    const cornerSize = 30;
    const corners = [
      [60, 60],
      [w - 60, 60],
      [60, h - 60],
      [w - 60, h - 60],
    ];
    ctx.strokeStyle = "#d4a843";
    ctx.lineWidth = 2;
    corners.forEach(([cx, cy]) => {
      const dx = cx < w / 2 ? 1 : -1;
      const dy = cy < h / 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cornerSize);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cornerSize, cy);
      ctx.stroke();
    });

    // Top decorative line
    const lineGrad = ctx.createLinearGradient(200, 0, w - 200, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, "#d4a843");
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 180);
    ctx.lineTo(w - 200, 180);
    ctx.stroke();

    // Title "漢名"
    ctx.fillStyle = "#d4a843";
    ctx.font = '36px "Noto Serif JP", serif';
    ctx.textAlign = "center";
    ctx.fillText("漢 名", w / 2, 150);

    // Main kanji - large
    const kanjiGrad = ctx.createLinearGradient(0, 300, 0, 700);
    kanjiGrad.addColorStop(0, "#f0d68a");
    kanjiGrad.addColorStop(0.5, "#d4a843");
    kanjiGrad.addColorStop(1, "#b8860b");
    ctx.fillStyle = kanjiGrad;

    const kanjiLen = candidate.kanji.length;
    const kanjiFontSize = kanjiLen <= 2 ? 280 : kanjiLen <= 3 ? 220 : 160;
    ctx.font = `900 ${kanjiFontSize}px "Noto Serif JP", serif`;
    ctx.textAlign = "center";
    ctx.fillText(candidate.kanji, w / 2, 520);

    // Decorative line below kanji
    ctx.strokeStyle = lineGrad;
    ctx.beginPath();
    ctx.moveTo(300, 600);
    ctx.lineTo(w - 300, 600);
    ctx.stroke();

    // Reading
    ctx.fillStyle = "#e0e0e0";
    ctx.font = '40px "Noto Serif JP", serif';
    ctx.fillText(candidate.reading, w / 2, 680);

    // Original name
    ctx.fillStyle = "#888888";
    ctx.font = '28px "Noto Serif JP", serif';
    ctx.fillText(name.toUpperCase(), w / 2, 740);

    // Type badge
    ctx.fillStyle = "rgba(212, 168, 67, 0.15)";
    const badgeW = 240;
    const badgeH = 44;
    const badgeX = w / 2 - badgeW / 2;
    const badgeY = 790;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 168, 67, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22);
    ctx.stroke();
    ctx.fillStyle = "#d4a843";
    ctx.font = '20px "Noto Serif JP", serif';
    ctx.fillText(
      `${candidate.type} — ${candidate.label}`,
      w / 2,
      badgeY + 30
    );

    // Meaning section
    ctx.fillStyle = "#d4a843";
    ctx.font = '22px "Noto Serif JP", serif';
    ctx.fillText("— Meaning —", w / 2, 910);

    ctx.fillStyle = "#c0c0c0";
    ctx.font = '24px "Noto Serif JP", serif';
    const meaningLines = wrapText(ctx, candidate.meaning, w - 240, 24);
    meaningLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, 960 + i * 40);
    });

    // Concept section
    const conceptY = 960 + meaningLines.length * 40 + 50;

    ctx.fillStyle = "#d4a843";
    ctx.font = '22px "Noto Serif JP", serif';
    ctx.fillText("— Concept —", w / 2, conceptY);

    ctx.fillStyle = "#a0a0a0";
    ctx.font = '22px "Noto Serif JP", serif';
    const conceptLines = wrapText(ctx, candidate.concept, w - 240, 22);
    conceptLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, conceptY + 50 + i * 36);
    });

    // Bottom decorative line
    ctx.strokeStyle = lineGrad;
    ctx.beginPath();
    ctx.moveTo(200, h - 180);
    ctx.lineTo(w - 200, h - 180);
    ctx.stroke();

    // Footer
    ctx.fillStyle = "#555555";
    ctx.font = '18px "Noto Serif JP", serif';
    ctx.fillText("漢名 KANJI NAME", w / 2, h - 130);
    ctx.font = '14px "Noto Serif JP", serif';
    ctx.fillStyle = "#444444";
    ctx.fillText("Powered by AI — For artistic reference", w / 2, h - 100);

    // Download
    const link = document.createElement("a");
    link.download = `kanji-${name.toLowerCase()}-${candidate.label.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [selected, candidates, name]);

  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto">
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-6xl font-black tracking-widest mb-2 gold-shimmer">
          漢名
        </h1>
        <p className="text-[var(--color-gold)] text-lg tracking-[0.3em] mb-1">
          KANJI NAME
        </p>
        <p className="text-[var(--color-text-muted)] text-sm mt-4 tracking-wide">
          Transform your name into beautiful Japanese kanji
        </p>
      </header>

      {/* Input Section */}
      <section className="max-w-lg mx-auto mb-16">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder="Enter your name in romaji..."
            maxLength={50}
            disabled={loading}
            className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-none
                       px-6 py-4 text-xl text-center tracking-widest
                       placeholder:text-[var(--color-text-muted)] placeholder:text-base placeholder:tracking-normal
                       focus:outline-none focus:border-[var(--color-gold-dark)]
                       transition-colors duration-300 disabled:opacity-50"
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-focus-within:w-full h-px bg-[var(--color-gold)] transition-all duration-500" />
        </div>

        <button
          onClick={generate}
          disabled={loading || !name.trim()}
          className="w-full mt-4 py-4 bg-transparent border border-[var(--color-gold-dark)] text-[var(--color-gold)]
                     tracking-[0.3em] text-sm uppercase
                     hover:bg-[var(--color-gold-dark)] hover:text-black
                     transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
                     active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </span>
          ) : (
            "Generate Kanji"
          )}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-lg mx-auto mb-8 p-4 border border-red-900/50 bg-red-950/20 text-red-400 text-center text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {candidates.length > 0 && (
        <section ref={resultsRef} className="mb-16">
          <h2 className="text-center text-[var(--color-gold)] tracking-[0.5em] text-sm mb-2">
            CANDIDATES
          </h2>
          <p className="text-center text-[var(--color-text-muted)] text-xs mb-10 tracking-wide">
            Select your favorite to create a name card
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`text-left p-6 border transition-all duration-300 animate-fade-in-up group
                  ${
                    selected === i
                      ? "border-[var(--color-gold)] bg-[var(--color-bg-card)] pulse-ring"
                      : "border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-gold)] hover:bg-[var(--color-bg-card-hover)]"
                  }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Type Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 flex items-center justify-center border border-[var(--color-gold-dark)] text-[var(--color-gold)] text-sm">
                      {TYPE_ICONS[c.type] || "字"}
                    </span>
                    <div>
                      <span className="text-[var(--color-gold)] text-sm tracking-wider">
                        {c.label}
                      </span>
                      <p className="text-[var(--color-text-muted)] text-xs">
                        {TYPE_SUBTITLES[c.type] || c.type}
                      </p>
                    </div>
                  </div>
                  {selected === i && (
                    <span className="text-[var(--color-gold)] text-xs tracking-wider">
                      SELECTED
                    </span>
                  )}
                </div>

                {/* Kanji */}
                <div className="text-center my-6">
                  <p
                    className={`font-black tracking-wider ${
                      c.kanji.length <= 2 ? "text-6xl" : c.kanji.length <= 3 ? "text-5xl" : "text-4xl"
                    } ${
                      selected === i
                        ? "gold-shimmer"
                        : "text-[var(--color-gold)]"
                    }`}
                  >
                    {c.kanji}
                  </p>
                  <p className="text-[var(--color-text-muted)] text-sm mt-2 tracking-widest">
                    {c.reading}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm border-t border-[var(--color-border)] pt-4">
                  <div>
                    <span className="text-[var(--color-gold-dark)] text-xs tracking-wider">
                      MEANING
                    </span>
                    <p className="text-[#c0c0c0] mt-0.5 leading-relaxed">
                      {c.meaning}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gold-dark)] text-xs tracking-wider">
                      CONCEPT
                    </span>
                    <p className="text-[#a0a0a0] mt-0.5 leading-relaxed">
                      {c.concept}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-gold-dark)] text-xs tracking-wider">
                      DESCRIPTION
                    </span>
                    <p className="text-[#808080] mt-0.5 leading-relaxed text-xs">
                      {c.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Download Section */}
      {selected !== null && (
        <section className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block border border-[var(--color-border-gold)] p-8 bg-[var(--color-bg-card)]">
            <p className="text-[var(--color-gold)] text-5xl font-black mb-2">
              {candidates[selected].kanji}
            </p>
            <p className="text-[var(--color-text-muted)] text-sm tracking-widest mb-1">
              {candidates[selected].reading}
            </p>
            <p className="text-[var(--color-text-muted)] text-xs mb-6">
              {name.toUpperCase()}
            </p>
            <button
              onClick={downloadCard}
              className="px-8 py-3 bg-[var(--color-gold-dark)] text-black text-sm tracking-[0.2em] uppercase
                         hover:bg-[var(--color-gold)] transition-colors duration-300 active:scale-[0.98]"
            >
              Download Name Card
            </button>
            <p className="text-[#555] text-xs mt-3">PNG 1200 × 1600px</p>
          </div>
        </section>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <footer className="text-center text-[#333] text-xs py-8 border-t border-[var(--color-border)]">
        <p>漢名 KANJI NAME — Powered by Claude AI</p>
        <p className="mt-1">
          Generated kanji names are artistic interpretations for reference only.
        </p>
      </footer>
    </main>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
