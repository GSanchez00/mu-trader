import { useState, useEffect, useMemo } from 'react'
import { fetchCandles }              from './utils/finnhub'
import { computeAllIndicators }      from './utils/technicalAnalysis'
import { generateAIAnalysis }        from './utils/aiAnalysis'
import Header               from './components/Header'
import PriceChart           from './components/PriceChart'
import AIAnalysis           from './components/AIAnalysis'
import StatsGrid            from './components/StatsGrid'
import TechnicalIndicators  from './components/TechnicalIndicators'
import SpotCalculator       from './components/SpotCalculator'

const TABS = [
  { id: 'calc',   label: 'Calculadora Spot' },
]

export default function App() {
  const [tab,     setTab]     = useState('calc')
  const [allData, setAllData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetchCandles('MU')
      .then(setAllData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const indicators = useMemo(() => computeAllIndicators(allData), [allData])
  const analysis   = useMemo(() => generateAIAnalysis(allData, indicators), [allData, indicators])

  const latest = allData[allData.length - 1]
  const prev   = allData[allData.length - 2]

  return (
    <div className="min-h-screen bg-[#080c18]">

      {/* Tab nav */}
      <div className="border-b border-[#1a2235]">
        <div className="max-w-[1400px] mx-auto px-6 flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-[#3aa6e8] text-[#dbe2ea]'
                  : 'border-transparent text-[#4a6080] hover:text-[#8aa0c0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'trader' && (
        <>
          {loading && (
            <div className="flex items-center justify-center h-64 text-[#4a90d9] text-sm">
              Cargando datos de MU...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-64 text-red-400 text-sm">
              Error: {error}
            </div>
          )}
          {!loading && !error && (
            <>
              <Header latest={latest} prev={prev} analysis={analysis} />
              <main className="max-w-[1400px] mx-auto p-6 space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="xl:col-span-2">
                    <PriceChart data={allData} indicators={indicators} />
                  </div>
                  <div>
                    <AIAnalysis analysis={analysis} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <StatsGrid allData={allData} latest={latest} />
                  <TechnicalIndicators indicators={indicators} data={allData} />
                </div>
              </main>
            </>
          )}
        </>
      )}

      {tab === 'calc' && <SpotCalculator />}

      <footer className="text-center py-6 text-[10px] text-[#2a3a5a]">
        MU Trader · Datos de mercado via Yahoo Finance · No constituye asesoría financiera
      </footer>
    </div>
  )
}
