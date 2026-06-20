import { BarChart2 } from 'lucide-react'

function Stat({ label, value, sub, subColor }) {
  return (
    <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-3">
      <div className="text-[10px] text-[#4a5a7a] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm font-bold text-white leading-tight">{value}</div>
      {sub && (
        <div className="text-[10px] mt-0.5 font-medium" style={{ color: subColor ?? '#4a5a7a' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function StatsGrid({ allData, latest }) {
  if (!latest || !allData.length) return null

  const closes   = allData.map(d => d.close)
  const high52w  = Math.max(...closes)
  const low52w   = Math.min(...closes)
  const pctHigh  = ((latest.close - high52w) / high52w) * 100
  const pctLow   = ((latest.close - low52w)  / low52w)  * 100
  const vol30avg = allData.slice(-30).reduce((s, d) => s + d.volume, 0) / 30
  const volAll   = allData.reduce((s, d) => s + d.volume, 0) / allData.length

  // MU ~1.1B shares outstanding
  const mktCap = latest.close * 1_100_000_000
  const fmtCap = mktCap >= 1e12
    ? `$${(mktCap / 1e12).toFixed(2)}T`
    : `$${(mktCap / 1e9).toFixed(1)}B`

  const dayRange = `$${latest.low.toFixed(2)} — $${latest.high.toFixed(2)}`
  const amplitude = (latest.high - latest.low).toFixed(2)
  const volVsAvg = latest.volume / volAll

  return (
    <div className="bg-[#0d1424] rounded-2xl border border-[#1a2540] p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-[#00d4aa]" />
        <h2 className="text-xs font-semibold text-[#4a5a7a] uppercase tracking-widest">
          Estadísticas Clave
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Máx. 52 Semanas"
          value={`$${high52w.toFixed(2)}`}
          sub={`${pctHigh.toFixed(1)}% desde el máximo`}
          subColor="#ef4444"
        />
        <Stat
          label="Mín. 52 Semanas"
          value={`$${low52w.toFixed(2)}`}
          sub={`+${pctLow.toFixed(1)}% desde el mínimo`}
          subColor="#00d4aa"
        />
        <Stat
          label="Cap. de Mercado"
          value={fmtCap}
          sub="~1.1B acciones"
        />
        <Stat
          label="Vol. Promedio 30d"
          value={`${(vol30avg / 1e6).toFixed(1)}M`}
          sub="acciones / día"
        />
        <Stat
          label="Volumen Hoy"
          value={`${(latest.volume / 1e6).toFixed(1)}M`}
          sub={volVsAvg >= 1 ? `▲ ${((volVsAvg - 1) * 100).toFixed(0)}% sobre promedio` : `▼ ${((1 - volVsAvg) * 100).toFixed(0)}% bajo promedio`}
          subColor={volVsAvg >= 1 ? '#00d4aa' : '#ef4444'}
        />
        <Stat
          label="Rango del Día"
          value={dayRange}
          sub={`Amplitud: $${amplitude}`}
        />
      </div>
    </div>
  )
}
