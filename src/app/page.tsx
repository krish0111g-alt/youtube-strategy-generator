"use client";

import { useState, useEffect } from "react";
import { Client } from "@gradio/client";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Youtube,
  Zap,
  TrendingUp,
  Target,
  Play,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  History,
  ChevronRight,
  Trash2,
  Clock,
  Volume2,
  Square,
} from "lucide-react";

const HISTORY_KEY = "krishai_history";
const MAX_HISTORY = 20;

interface Strategy {
  id: string;
  name: string;
  category: string;
  topic: string;
  titles: string[];
  hook: string;
  createdAt: number;
}

const categories = [
  { value: "Tech/Documentary", label: "Tech/Documentary" },
  { value: "Gaming", label: "Gaming" },
  { value: "Vlogs", label: "Vlogs" },
  { value: "Finance", label: "Finance" },
  { value: "Other", label: "Other" },
];

function loadHistory(): Strategy[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry: Strategy) {
  const prev = loadHistory();
  const updated = [entry, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fireConfetti() {
  const count = 180;
  const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 9999 };
  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  confetti({ ...defaults, particleCount: count * 0.3, origin: { x: randomInRange(0.1, 0.3), y: 0.45 }, colors: ["#f97316", "#fb923c", "#fdba74"] });
  confetti({ ...defaults, particleCount: count * 0.3, origin: { x: randomInRange(0.7, 0.9), y: 0.45 }, colors: ["#38bdf8", "#7dd3fc", "#bae6fd"] });
  confetti({ ...defaults, particleCount: count * 0.4, origin: { x: 0.5, y: 0.4 }, colors: ["#f97316", "#ffffff", "#38bdf8"] });
}

export default function Home() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ titles: string[]; hook: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<Strategy[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historyCopied, setHistoryCopied] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleGenerate = async () => {
    if (!name.trim() || !category || !topic.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      const client = await Client.connect("krish-ai-dev/krish-viral-ai");
      const result = await client.predict(0, [name, category, topic]);

      if (result && result.data) {
        let titles: string[] = [];
        let hook: string = "";

        const fullText = Array.isArray(result.data)
          ? result.data.map((d: unknown) => (typeof d === "string" ? d : JSON.stringify(d))).join("\n")
          : typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data);

        const cleanMarkdown = (text: string) =>
          text
            .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
            .replace(/^#+\s*/gm, "")
            .replace(/^[-_]{3,}\s*$/gm, "")
            .trim();

        const hookMatch = fullText.match(
          /(?:30[- ]second\s+)?(?:opening\s+)?(?:hook|script)[:\s\n]+([^]*)/i
        );
        if (hookMatch) {
          const hookRaw = hookMatch[1].replace(/\n#+\s+\S.*/s, "").trim();
          hook = cleanMarkdown(hookRaw);
        }

        const rawTitles = Array.isArray(result.data) ? result.data[0] : fullText;
        if (typeof rawTitles === "string") {
          try {
            const parsed = JSON.parse(rawTitles);
            if (Array.isArray(parsed)) {
              titles = parsed.map((t: unknown) => String(t).trim()).filter(Boolean);
            }
          } catch {
            titles = rawTitles
              .split("\n")
              .map((line: string) => line.trim())
              .filter((line: string) => /^(\d+[\.\):]|[-*•])\s+\S/.test(line))
              .map((line: string) =>
                cleanMarkdown(line.replace(/^(\d+[\.\):]|[-*•])\s+/, ""))
              )
              .filter((t: string) => t.length > 0);
          }
        }

        if (titles.length > 0 || hook) {
          const finalTitles = titles.slice(0, 3);
          setResults({ titles: finalTitles, hook });

          const entry: Strategy = {
            id: Date.now().toString(),
            name: name.trim(),
            category,
            topic: topic.trim(),
            titles: finalTitles,
            hook,
            createdAt: Date.now(),
          };
          saveToHistory(entry);
          setHistory(loadHistory());

          fireConfetti();
        } else {
          setError("No results returned from API. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string | number) => {
    await navigator.clipboard.writeText(text);
    if (typeof key === "number") {
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setHistoryCopied(key);
      setTimeout(() => setHistoryCopied(null), 2000);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
    if (expandedHistory === id) setExpandedHistory(null);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setExpandedHistory(null);
  };

  const toggleSpeech = (text: string) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      /en[-_](IN|US|GB)/i.test(v.lang)
    ) || voices.find((v) => /en/i.test(v.lang));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const isFormValid = name.trim() && category && topic.trim();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <section className="pt-20 pb-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Youtube className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-orange-400">Powered by Krish Strategy Engine</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Krish AI:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600">
                Viral Hook & Title Generator
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Enter your details and let AI craft high-CTR titles and scroll-stopping opening hooks tailored to your niche.
            </p>
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/40 via-orange-400/30 to-orange-600/40 rounded-3xl blur-sm" />
              <div className="relative bg-[#0d1526] rounded-3xl p-8 md:p-10 border border-white/5">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Krish"
                      className="w-full bg-[#1a2540] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Channel Category
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#1a2540] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-slate-500">
                          Select your niche...
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value} className="text-white bg-[#1a2540]">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                      Your Video Topic / Idea
                    </label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. ChatGPT plugins, iPhone 16 review, day in my life as a creator..."
                      rows={4}
                      className="w-full bg-[#1a2540] border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading || !isFormValid}
                    className="w-full flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all duration-200 shadow-xl shadow-orange-500/30 hover:shadow-orange-400/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-orange-500 disabled:hover:to-orange-600 text-base"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating Your Strategy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Strategy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-3xl mx-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                  <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-400" />
                </div>
                <p className="text-slate-400 text-sm">AI is analyzing your topic and crafting viral content...</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-300 mb-1">Error Generating Strategy</h3>
                  <p className="text-red-200/80 text-sm">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {results && !loading && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-6">
                <div className="bg-[#0d1526] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="font-bold text-lg">3 High-CTR Titles</h3>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Click to copy any title</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {results.titles.map((title, idx) => (
                      <div
                        key={idx}
                        onClick={() => copyToClipboard(title, idx)}
                        className="group px-6 py-5 hover:bg-white/[0.02] cursor-pointer transition-all flex items-start justify-between gap-4"
                      >
                        <div className="flex-1">
                          <span className="text-xs font-bold text-orange-500/60 mr-2">{String(idx + 1).padStart(2, "0")}</span>
                          <span className="text-slate-200 group-hover:text-white transition-colors">{title}</span>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          {copiedIndex === idx ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Copied
                            </span>
                          ) : (
                            <Copy className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-colors" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0d1526] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Play className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="font-bold text-lg">30-Second Opening Hook</h3>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Script designed to maximize retention</p>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">{results.hook}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => copyToClipboard(results.hook, -1)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-all"
                      >
                        {copiedIndex === -1 ? (
                          <>
                            <Check className="w-4 h-4" />
                            Hook Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Hook Script
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => toggleSpeech(results.hook)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          isSpeaking
                            ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-4 h-4 fill-current" />
                            Stop Audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            Listen Script
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 text-sm font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate New Strategy
                  </button>
                </div>
              </div>
            )}

            {!results && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 flex items-center justify-center mb-5">
                  <Target className="w-8 h-8 text-orange-400/50" />
                </div>
                <p className="text-slate-500 text-sm max-w-xs">
                  Your viral titles and hooks will appear here once you generate a strategy.
                </p>
              </div>
            )}
          </div>
        </section>

        {history.length > 0 && (
          <section className="px-6 pb-20">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <History className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="font-bold text-lg">Saved History</h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs font-medium">
                    {history.length}
                  </span>
                </div>
                <button
                  onClick={clearHistory}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {history.map((entry) => {
                  const isOpen = expandedHistory === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="bg-[#0d1526] rounded-2xl border border-white/5 overflow-hidden transition-all"
                    >
                      <div
                        onClick={() => setExpandedHistory(isOpen ? null : entry.id)}
                        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.02] cursor-pointer transition-all text-left"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{entry.topic}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-orange-400/70 font-medium">{entry.category}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-xs text-slate-500">{entry.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                            <Clock className="w-3 h-3" />
                            {formatDate(entry.createdAt)}
                          </div>
                          <button
                            onClick={(e) => deleteHistoryItem(entry.id, e)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-white/5 transition-colors"
                            title="Delete this item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              Titles
                            </p>
                            <div className="space-y-2">
                              {entry.titles.map((title, ti) => (
                                <div
                                  key={ti}
                                  onClick={() => copyToClipboard(title, `h-${entry.id}-t${ti}`)}
                                  className="group flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition-all"
                                >
                                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">
                                    <span className="text-orange-500/50 font-bold mr-1.5">{String(ti + 1).padStart(2, "0")}</span>
                                    {title}
                                  </span>
                                  {historyCopied === `h-${entry.id}-t${ti}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 flex-shrink-0 mt-0.5 transition-colors" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {entry.hook && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5" />
                                Hook Script
                              </p>
                              <div className="px-3 py-3 rounded-xl bg-white/[0.03] relative group">
                                <p className="text-sm text-slate-300 leading-relaxed pr-8">{entry.hook}</p>
                                <button
                                  onClick={() => copyToClipboard(entry.hook, `h-${entry.id}-hook`)}
                                  className="absolute top-3 right-3 text-slate-600 hover:text-orange-400 transition-colors"
                                >
                                  {historyCopied === `h-${entry.id}-hook` ? (
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-white/5 py-8 mt-8 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Youtube className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">
                Krish<span className="text-orange-400">AI</span>
              </span>
            </div>

            <a
              href="https://www.notion.so/krish-thumbnails"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-orange-600/5 text-orange-400 font-medium text-sm hover:border-orange-500/40 hover:from-orange-500/10 hover:to-orange-600/10 transition-all"
            >
              Want Professional Thumbnail Editing?
              <span className="text-white font-semibold">View Krish Portfolio</span>
              <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <p className="text-xs text-slate-600 order-last sm:order-none">
              &copy; {new Date().getFullYear()} KrishStrategy. Built for creators.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
