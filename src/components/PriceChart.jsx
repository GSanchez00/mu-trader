import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const TIMEFRAMES = [
  { label: '1S', days: 5 },
  { label: '1M', days: 21 },
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1A', days: 252 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-[#0d1424] border border-[#1a2540] rounded-xl p-3 text-xs shadow-2xl min-w-[160px]">
      <p className="text-[#4a5a7a] font-medium mb-2">{d.date}</p>
      {[
        ['Cierre',   d.close,  'text-white font-semibold'],
        ['Apertura', d.open,   'text-[#94a3b8]'],
        ['Máximo',   d.high,   'text-[#00d4aa]'],
        ['Mínimo',   d.low,    'text-[#ef4444]'],
      ].map(([lbl, val, cls]) => (
        <div key={lbl} className="flex justify-between gap-6 mb-0.5">
          <span className="text-[#4a5a7a]">{lbl}</span>
          <span className={cls}>${val?.toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-6 pt-1.5 mt-1.5 border-t border-[#1a2540]">
        <span className="text-[#4a5a7a]">Volumen</span>
        <span className="text-[#94a3b8]">{(d.volume / 1e6).toFixed(1)}M</span>
      </div>
    </div>
  )
}

export default function PriceChart({ data, indicators }) {
  const [tf, setTf] = useState('3M')

  const days = TIMEFRAMES.find(t => t.label === tf)?.days ?? 63

  const chartData = useMemo(() => {
    const sliced = data.slice(-days)
    return sliced.map((d, i) => {
      const idx = data.length - days + i
      const bb  = indicators.bollingerBands[idx]
      return {
        ...d,
        sma20:   indicators.sma20[idx],
        sma50:   indicators.sma50[idx],
        sma200:  indicators.sma200[idx],
        bbUpper: bb?.upper ?? null,
        bbLower: bb?.lower ?? null,
      }
    })
  }, [data, indicators, days])

  const closes   = chartData.map(d => d.close).filter(Boolean)
  const minPrice = Math.min(...closes) * 0.975
  const maxPrice = Math.max(...closes) * 1.025

  const latest  = data[data.length - 1]
  const prevDay = data[data.length - 2]
  const isUp    = latest?.close >= (prevDay?.close ?? latest?.close)

  const priceColor = isUp ? '#00d4aa' : '#ef4444'

  return (
    <div className="bg-[#0d1424] rounded-2xl border border-[#1a2540] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-[#4a5a7a] uppercase tracking-widest">
          Gráfico de Precio
        </h2>
        <div className="flex gap-1 bg-[#080c18] rounded-lg p-1">
          {TIMEFRAMES.map(t => (
            <button
              key={t.label}
              onClick={() => setTf(t.label)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                tf === t.label
                  ? 'bg-[#1a2540] text-white shadow'
                  : 'text-[#4a5a7a] hover:text-[#94a3b8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price chart */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={priceColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={priceColor} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#111d35" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#3a4a6a', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#1a2540' }}
            interval={Math.floor(chartData.length / 5)}
            tickFormatter={v => {
              const d = new Date(v + 'T00:00:00')
              return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
            }}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#3a4a6a', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v.toFixed(0)}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Bollinger Bands */}
          <Line type="monotone" dataKey="bbUpper" stroke="#2a3a5a" strokeWidth={1} strokeDasharray="5 3" dot={false} name="BB+" activeDot={false} />
          <Line type="monotone" dataKey="bbLower" stroke="#2a3a5a" strokeWidth={1} strokeDasharray="5 3" dot={false} name="BB-" activeDot={false} />

          {/* Moving averages */}
          <Line type="monotone" dataKey="sma200" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="MM200" activeDot={false} />
          <Line type="monotone" dataKey="sma50"  stroke="#fb923c" strokeWidth={1.5} dot={false} name="MM50"  activeDot={false} />
          <Line type="monotone" dataKey="sma20"  stroke="#60a5fa" strokeWidth={1.5} dot={false} name="MM20"  activeDot={false} />

          {/* Price area */}
          <Area
            type="monotone"
            dataKey="close"
            stroke={priceColor}
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            name="Precio"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume chart */}
      <div className="mt-1">
        <ResponsiveContainer width="100%" height={70}>
          <ComposedChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111d35" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis
              tick={{ fill: '#3a4a6a', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${(v / 1e6).toFixed(0)}M`}
              width={52}
            />
            <Bar dataKey="volume" name="Volumen" maxBarSize={8}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.close >= d.open ? '#00d4aa35' : '#ef444435'}
                  stroke={d.close >= d.open ? '#00d4aa80' : '#ef444480'}
                  strokeWidth={0.5}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#1a2540]">
        {[
          { label: 'MM20',  color: '#60a5fa' },
          { label: 'MM50',  color: '#fb923c' },
          { label: 'MM200', color: '#a78bfa' },
          { label: 'BB (20,2)', color: '#2a3a5a', dashed: true },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line
                x1="0" y1="4" x2="20" y2="4"
                stroke={item.color}
                strokeWidth="2"
                strokeDasharray={item.dashed ? '5 3' : undefined}
              />
            </svg>
            <span className="text-[10px] text-[#4a5a7a]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
