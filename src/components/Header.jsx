import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export default function Header({ latest, prev, analysis }) {
  if (!latest) return null

  const change    = latest.close - (prev?.close ?? latest.close)
  const changePct = prev ? (change / prev.close) * 100 : 0
  const isUp      = change >= 0

  const today = new Date(2026, 4, 29).toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2540] bg-[#0d1424]">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00d4aa15] border border-[#00d4aa30] flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#00d4aa]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            MU — Micron Technology
          </h1>
          <p className="text-xs text-[#4a5a7a] capitalize">{today} · NASDAQ · Semiconductores</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-3xl font-black text-white tracking-tight">
            ${latest.close.toFixed(2)}
          </div>
          <div
            className={`flex items-center gap-1 justify-end text-sm font-semibold ${
              isUp ? 'text-[#00d4aa]' : 'text-[#ef4444]'
            }`}
          >
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>
              {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {analysis && (
          <div
            className="text-center px-5 py-2.5 rounded-xl border"
            style={{ borderColor: analysis.color + '40', background: analysis.color + '12' }}
          >
            <div className="text-xs text-[#4a5a7a] mb-0.5 uppercase tracking-wider">Señal IA</div>
            <div className="text-lg font-black" style={{ color: analysis.color }}>
              {analysis.recommendation}
            </div>
            <div className="text-xs mt-0.5" style={{ color: analysis.color + 'aa' }}>
              {analysis.confidence.toFixed(0)}% confianza
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
