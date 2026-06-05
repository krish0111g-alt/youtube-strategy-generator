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
  Square
} from "lucide-react";

export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#fff' }}>
      <h1>🚀 KrishAI Is Ready!</h1>
      <p>Aapki file successfully setup ho gayi hai.</p>
    </div>
  );
}
