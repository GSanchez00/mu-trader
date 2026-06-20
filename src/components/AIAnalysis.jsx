import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function SideBadge({ side }) {
  if (side === 'bull') return (
    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#00d4aa20] text-[#00d4aa] font-bold uppercase tracking-wide border border-[#00d4aa30]">
      <TrendingUp className="w-2.5 h-2.5" />ALCISTA
    </span>
  )
  if (side === 'bear') return (
    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#ef444420] text-[#ef4444] font-bold uppercase tracking-wide border border-[#ef444430]">
      <TrendingDown className="w-2.5 h-2.5" />BAJISTA
    </span>
  )
  return (
    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[#fbbf2420] text-[#fbbf24] font-bold uppercase tracking-wide border border-[#fbbf2430]">
      <Minus className="w-2.5 h-2.5" />NEUTRAL
    </span>
  )
}

function ScoreBar({ bull, bear }) {
  const total = bull + bear || 1
  const bullW = (bull / total) * 100
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-[#00d4aa] font-semibold">▲ {bull} pts alcistas</span>
        <span className="text-[#ef4444] font-semibold">{bear} pts bajistas ▼</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-[#ef444430] flex">
        <div
          className="h-full rounded-full bg-[#00d4aa] transition-all duration-700"
          style={{ width: `${bullW}%` }}
        />
      </div>
    </div>
  )
}

export default function AIAnalysis({ analysis }) {
  if (!analysis) return null

  const { recommendation, confidence, color, signals, bullScore, bearScore, summary } = analysis

  return (
    <div className="bg-[#0d1424] rounded-2xl border border-[#1a2540] p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-[#00d4aa]" />
        <h2 className="text-xs font-semibold text-[#4a5a7a] uppercase tracking-widest">
          Análisis de IA
        </h2>
      </div>

      {/* Main signal */}
      <div
        className="rounded-xl border p-4 text-center"
        style={{ borderColor: color + '40', background: color + '0e' }}
      >
        <div className="text-[10px] text-[#4a5a7a] uppercase tracking-widest mb-1">Recomendación</div>
        <div className="text-3xl font-black tracking-tight mb-1" style={{ color }}>
          {recommendation}
        </div>
        <div className="text-xs mb-2" style={{ color: color + 'aa' }}>
          Confianza: {confidence.toFixed(0)}%
        </div>
        <div className="h-1.5 rounded-full bg-[#111d35] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${confidence}%`, background: color }}
          />
        </div>
      </div>

      {/* Score bar */}
      <ScoreBar bull={bullScore} bear={bearScore} />

      {/* Summary */}
      <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-3">
        <p className="text-xs text-[#7a8aaa] leading-relaxed">{summary}</p>
      </div>

      {/* Signals */}
      <div className="flex-1 min-h-0">
        <div className="text-[10px] font-semibold text-[#4a5a7a] uppercase tracking-widest mb-2">
          Señales Detectadas ({signals.length})
        </div>
        <div className="space-y-2 overflow-y-auto max-h-64 pr-0.5">
          {signals.map((sig, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-xl bg-[#080c18] border border-[#1a2540] p-2.5"
            >
              <SideBadge side={sig.side} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white leading-tight">{sig.label}</div>
                <div className="text-[10px] text-[#4a5a7a] mt-0.5 leading-relaxed">{sig.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
