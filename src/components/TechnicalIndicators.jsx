import { Zap } from 'lucide-react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

function RSIGauge({ value }) {
  if (value == null) return <div className="text-xs text-[#4a5a7a]">Calculando...</div>

  const color  = value < 30 ? '#00d4aa' : value > 70 ? '#ef4444' : '#fbbf24'
  const label  = value < 30 ? 'Sobrevendido' : value > 70 ? 'Sobrecomprado' : 'Neutral'

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-4xl font-black" style={{ color }}>{value.toFixed(1)}</span>
          <span className="text-xs text-[#4a5a7a] ml-1">/ 100</span>
        </div>
        <span className="text-sm font-bold mb-1" style={{ color }}>{label}</span>
      </div>

      <div className="relative h-3 rounded-full bg-[#111d35] overflow-visible">
        {/* Zones */}
        <div className="absolute inset-y-0 left-0 w-[30%] rounded-l-full bg-[#00d4aa18]" />
        <div className="absolute inset-y-0 right-0 w-[30%] rounded-r-full bg-[#ef444418]" />
        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#0d1424] shadow-lg"
          style={{
            left: `clamp(8px, calc(${value}% - 8px), calc(100% - 8px))`,
            background: color,
            boxShadow: `0 0 10px ${color}80`,
          }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-[#3a4a6a] mt-1.5">
        <span>0 · Sobrevendido</span>
        <span>50</span>
        <span>Sobrecomprado · 100</span>
      </div>
    </div>
  )
}

function Row({ label, value, badge, badgeColor }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#111d35] last:border-0">
      <span className="text-xs text-[#4a5a7a]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-white">{value}</span>
        {badge && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: badgeColor + '25', color: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

export default function TechnicalIndicators({ indicators, data }) {
  if (!indicators || !data.length) return null

  const n    = data.length - 1
  const c    = data[n].close
  const rsiV = indicators.rsi[n]
  const s20  = indicators.sma20[n]
  const s50  = indicators.sma50[n]
  const s200 = indicators.sma200[n]
  const bb   = indicators.bollingerBands[n]
  const mL   = indicators.macd.line[n]
  const mS   = indicators.macd.signal[n]
  const mH   = indicators.macd.histogram[n]

  const bbPos = bb?.upper && bb?.lower
    ? +((( c - bb.lower) / (bb.upper - bb.lower)) * 100).toFixed(0)
    : null
  const bbW = bb?.upper && bb?.middle
    ? +((bb.upper - bb.lower) / bb.middle * 100).toFixed(1)
    : null

  // MACD histogram for mini chart
  const macdChartData = indicators.macd.histogram
    .slice(-40)
    .map((v, i) => ({ i, v: v ?? 0 }))

  return (
    <div className="bg-[#0d1424] rounded-2xl border border-[#1a2540] p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#00d4aa]" />
        <h2 className="text-xs font-semibold text-[#4a5a7a] uppercase tracking-widest">
          Indicadores Técnicos
        </h2>
      </div>

      {/* RSI */}
      <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-4">
        <div className="text-[10px] text-[#4a5a7a] uppercase tracking-widest mb-3">RSI (14)</div>
        <RSIGauge value={rsiV} />
      </div>

      {/* Moving Averages */}
      <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-3">
        <div className="text-[10px] text-[#4a5a7a] uppercase tracking-widest mb-1">Medias Móviles</div>
        <Row label="MM20"  value={s20  ? `$${s20.toFixed(2)}`  : 'N/A'} badge={s20  ? (c > s20  ? '▲ SOBRE' : '▼ BAJO') : ''} badgeColor={s20  ? (c > s20  ? '#00d4aa' : '#ef4444') : ''} />
        <Row label="MM50"  value={s50  ? `$${s50.toFixed(2)}`  : 'N/A'} badge={s50  ? (c > s50  ? '▲ SOBRE' : '▼ BAJO') : ''} badgeColor={s50  ? (c > s50  ? '#00d4aa' : '#ef4444') : ''} />
        <Row label="MM200" value={s200 ? `$${s200.toFixed(2)}` : 'N/A'} badge={s200 ? (c > s200 ? '▲ SOBRE' : '▼ BAJO') : ''} badgeColor={s200 ? (c > s200 ? '#00d4aa' : '#ef4444') : ''} />
      </div>

      {/* Bollinger Bands */}
      <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-3">
        <div className="text-[10px] text-[#4a5a7a] uppercase tracking-widest mb-1">Bandas de Bollinger (20,2)</div>
        <Row label="Banda Superior" value={bb?.upper ? `$${bb.upper.toFixed(2)}` : 'N/A'} />
        <Row label="Banda Media"    value={bb?.middle ? `$${bb.middle.toFixed(2)}` : 'N/A'} />
        <Row label="Banda Inferior" value={bb?.lower ? `$${bb.lower.toFixed(2)}` : 'N/A'} />
        <Row
          label="%B (posición)"
          value={bbPos != null ? `${bbPos}%` : 'N/A'}
          badge={bbPos != null ? (bbPos > 80 ? 'ALTO' : bbPos < 20 ? 'BAJO' : 'MEDIO') : ''}
          badgeColor={bbPos != null ? (bbPos > 80 ? '#ef4444' : bbPos < 20 ? '#00d4aa' : '#fbbf24') : ''}
        />
        <Row label="Ancho de Banda" value={bbW != null ? `${bbW}%` : 'N/A'} />
      </div>

      {/* MACD */}
      <div className="rounded-xl bg-[#080c18] border border-[#1a2540] p-3">
        <div className="text-[10px] text-[#4a5a7a] uppercase tracking-widest mb-1">MACD (12, 26, 9)</div>
        <Row
          label="MACD"
          value={mL != null ? mL.toFixed(3) : 'N/A'}
          badge={mL != null && mS != null ? (mL > mS ? 'ALCISTA' : 'BAJISTA') : ''}
          badgeColor={mL != null && mS != null ? (mL > mS ? '#00d4aa' : '#ef4444') : ''}
        />
        <Row label="Señal"       value={mS != null ? mS.toFixed(3) : 'N/A'} />
        <Row
          label="Histograma"
          value={mH != null ? mH.toFixed(3) : 'N/A'}
          badge={mH != null ? (mH > 0 ? '▲ POS' : '▼ NEG') : ''}
          badgeColor={mH != null ? (mH > 0 ? '#00d4aa' : '#ef4444') : ''}
        />

        {/* Mini MACD histogram chart */}
        <div className="mt-3">
          <div className="text-[9px] text-[#3a4a6a] mb-1">Histograma (últimos 40 días)</div>
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={macdChartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <ReferenceLine y={0} stroke="#1a2540" />
              <Bar dataKey="v" maxBarSize={5}>
                {macdChartData.map((d, i) => (
                  <Cell key={i} fill={d.v >= 0 ? '#00d4aa80' : '#ef444480'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
