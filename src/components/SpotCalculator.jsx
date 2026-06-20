import { useState, useEffect, useMemo } from 'react'

const SYMBOLS = {
  ONDO:  'ONDOUSDT',
  XRP:   'XRPUSDT',
  HYPER: 'HYPERUSDT',
  BTC:   'BTCUSDT',
  ETH:   'ETHUSDT',
  MUB:   'MUBUSDT',
  SNDK:  'SNDKBUSDT',
}

const TICKERS = [
  { sym: 'ONDO',  pair: 'ONDO/USDT',  label: 'spot' },
  { sym: 'XRP',   pair: 'XRP/USDT',   label: 'spot' },
  { sym: 'HYPER', pair: 'HYPER/USDT', label: 'spot' },
  { sym: 'BTC',   pair: 'BTC/USDT',   label: 'spot' },
  { sym: 'ETH',   pair: 'ETH/USDT',   label: 'spot' },
  { sym: 'MUB',   pair: 'MUB/USDT',   label: 'bStock', note: 'Micron tokenizada · fee 0.15%', fee: 0.15 },
  { sym: 'SNDK',  pair: 'SNDKB/USDT', label: 'bStock', note: 'SanDisk tokenizada · fee 0.15%', fee: 0.15 },
]

const C = {
  bg:      '#0a0c0f',
  panel:   '#10141a',
  panel2:  '#151a22',
  line:    '#212833',
  text:    '#dbe2ea',
  dim:     '#6b7686',
  green:   '#21c97a',
  red:     '#e5484d',
  amber:   '#e8a23a',
  accent:  '#3aa6e8',
}

function mkState(fee = 0.1) {
  return { qty: '', buyPrice: '', sellPrice: '', targetPct: '', feePct: String(fee), mode: 'sell', qtyMode: 'crypto' }
}

function fmtUsd(n) {
  return isFinite(n)
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT'
    : '—'
}

function fmtPrice(n) {
  if (!isFinite(n)) return '—'
  const d = n < 1 ? 5 : n < 10 ? 4 : 2
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function compute(s) {
  const rawQty   = parseFloat(s.qty)
  const buyPrice = parseFloat(s.buyPrice)
  const feeRate  = (parseFloat(s.feePct) || 0) / 100

  if (!(rawQty > 0) || !(buyPrice > 0)) return {}

  const qty           = s.qtyMode === 'usd' ? rawQty / buyPrice : rawQty
  const grossInvested = qty * buyPrice
  const feeBuy        = grossInvested * feeRate
  const totalInvested = grossInvested + feeBuy
  const breakeven     = totalInvested / (qty * (1 - feeRate))

  if (s.mode === 'sell') {
    const sellPrice = parseFloat(s.sellPrice)
    if (!(sellPrice > 0)) return { qty, totalInvested, feeBuy, breakeven, error: 'Ingresá un precio de venta válido.' }
    const grossSell   = qty * sellPrice
    const feeSell     = grossSell * feeRate
    const netReceived = grossSell - feeSell
    const pnlUsd      = netReceived - totalInvested
    const netPct      = (pnlUsd / totalInvested) * 100
    return { qty, totalInvested, feeBuy, breakeven, sellPrice, grossSell, feeSell, netReceived, pnlUsd, netPct }
  } else {
    const targetPct = parseFloat(s.targetPct)
    if (isNaN(targetPct)) return { qty, totalInvested, feeBuy, breakeven, error: 'Ingresá el % de ganancia neta deseado.' }
    const desiredNet  = totalInvested * (1 + targetPct / 100)
    const sellPrice   = desiredNet / (qty * (1 - feeRate))
    const grossSell   = qty * sellPrice
    const feeSell     = grossSell * feeRate
    const netReceived = grossSell - feeSell
    const pnlUsd      = netReceived - totalInvested
    return { qty, totalInvested, feeBuy, breakeven, sellPrice, grossSell, feeSell, netReceived, pnlUsd, netPct: targetPct }
  }
}

function Row({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'9px 0', borderBottom:`1px dashed ${C.line}`, fontSize:13 }}>
      <span style={{ color: C.dim }}>{label}</span>
      <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:500, color: color || C.text }}>{value}</span>
    </div>
  )
}

function Input({ id, value, onChange, placeholder, suffix, step = 'any', min = '0' }) {
  return (
    <div style={{ display:'flex' }}>
      <input
        type="number" id={id} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} step={step} min={min}
        style={{
          flex:1, background:C.bg, border:`1px solid ${C.line}`, borderRight:'none',
          color:C.text, fontFamily:'inherit', fontSize:14, padding:'9px 10px',
          outline:'none', fontVariantNumeric:'tabular-nums',
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.line}
      />
      {suffix && (
        <div style={{ background:C.panel2, border:`1px solid ${C.line}`, borderLeft:'none', color:C.dim, fontSize:12, padding:'9px 10px', whiteSpace:'nowrap' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex:1, background: active ? C.accent : C.bg, color: active ? '#06141f' : C.dim,
      border:'none', padding:'8px 6px', fontFamily:'inherit', fontSize:11,
      letterSpacing:'0.05em', cursor:'pointer', fontWeight: active ? 600 : 400,
      transition:'all 0.15s ease',
    }}>
      {children}
    </button>
  )
}

export default function SpotCalculator() {
  const [activeSym, setActiveSym]   = useState('ONDO')
  const [priceCache, setPriceCache] = useState({})
  const [states, setStates]         = useState(() =>
    Object.fromEntries(TICKERS.map(t => [t.sym, mkState(t.fee ?? 0.1)]))
  )

  const s      = states[activeSym]
  const result = useMemo(() => compute(s), [s])

  function patch(p) {
    setStates(prev => ({ ...prev, [activeSym]: { ...prev[activeSym], ...p } }))
  }

  function selectTicker(sym) {
    if (sym === activeSym) return
    setActiveSym(sym)
    if (!states[sym].buyPrice && priceCache[sym]) {
      setStates(prev => ({ ...prev, [sym]: { ...prev[sym], buyPrice: String(priceCache[sym]) } }))
    }
  }

  function clearTicker() {
    const t    = TICKERS.find(t => t.sym === activeSym)
    const next = mkState(t.fee ?? 0.1)
    if (priceCache[activeSym]) next.buyPrice = String(priceCache[activeSym])
    setStates(prev => ({ ...prev, [activeSym]: next }))
  }

  useEffect(() => {
    async function load() {
      const prices = {}
      for (const [sym, pair] of Object.entries(SYMBOLS)) {
        try {
          const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`)
          prices[sym] = r.ok ? parseFloat((await r.json()).price) : null
        } catch { prices[sym] = null }
      }
      setPriceCache(prices)
      setStates(prev => {
        const next = { ...prev }
        for (const [sym, price] of Object.entries(prices)) {
          if (price && !prev[sym].buyPrice)
            next[sym] = { ...prev[sym], buyPrice: String(price) }
        }
        return next
      })
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  const feePct = parseFloat(s.feePct) || 0
  const netPct = result.netPct ?? 0
  const netPos = netPct >= 0

  return (
    <div style={{ fontFamily:"'JetBrains Mono','SF Mono',Consolas,monospace", color: C.text, padding:'24px 16px 60px' }}>
      <div style={{ maxWidth:980, margin:'0 auto' }}>

        {/* Header strip */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderBottom:`1px solid ${C.line}`, paddingBottom:14, marginBottom:22, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:13, letterSpacing:'0.18em', textTransform:'uppercase', color:C.dim }}>
            Spot Calc <b style={{ color:C.text, fontWeight:600 }}>// Binance Net P&amp;L</b>
          </div>
          <div style={{ fontSize:12, color:C.dim }}>
            Fee por operación: <span style={{ color:C.amber }}>{feePct.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%</span>
            {' · ida y vuelta '}
            <span style={{ color:C.amber }}>{(feePct * 2).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%</span>
          </div>
        </div>

        {/* Ticker strip */}
        <style>{`
          .ticker-strip { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:${C.line}; border:1px solid ${C.line}; margin-bottom:22px; }
          .ticker-card  { padding:12px 14px; }
          .ticker-price { font-size:16px; }
          .ticker-note  { display:none; }
          .calc-grid    { display:grid; grid-template-columns:1fr; gap:16px; }
          @media (min-width: 640px) {
            .ticker-strip { display:flex; }
            .ticker-card  { flex:1 0 0; padding:14px 16px; }
            .ticker-price { font-size:20px; }
            .ticker-note  { display:block; }
            .calc-grid    { grid-template-columns:1.1fr 1fr; }
          }
        `}</style>
        <div className="ticker-strip">
          {TICKERS.map(t => {
            const active = t.sym === activeSym
            const price  = priceCache[t.sym]
            return (
              <div key={t.sym} onClick={() => selectTicker(t.sym)}
                className="ticker-card"
                style={{ background: active ? C.panel2 : C.panel, cursor:'pointer', position:'relative', transition:'background 0.15s ease' }}>
                {active && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:C.accent }} />}
                <div style={{ fontSize:11, letterSpacing:'0.1em', color:C.dim, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:C.text, fontWeight:600 }}>{t.pair}</span>
                  <span>{t.label}</span>
                </div>
                <div className="ticker-price" style={{ fontWeight:600, marginTop:6, color: price ? C.text : C.dim, fontVariantNumeric:'tabular-nums' }}>
                  {price ? fmtPrice(price) : '—'}
                </div>
                <div className="ticker-note" style={{ fontSize:10, color:C.dim, marginTop:4 }}>
                  {t.note ?? 'tocá para usar este precio'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="calc-grid">

          {/* INPUT */}
          <div style={{ background:C.panel, border:`1px solid ${C.line}` }}>
            <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.line}`, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:C.dim, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Parámetros de la operación</span>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span>{activeSym}</span>
                <button onClick={clearTicker} style={{ background:'transparent', border:`1px solid ${C.line}`, color:C.dim, fontFamily:'inherit', fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', padding:'4px 9px', cursor:'pointer' }}>
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{ padding:'18px 16px' }}>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>¿Cómo querés ingresar el monto?</label>
                <div style={{ display:'flex', border:`1px solid ${C.line}`, marginBottom:16 }}>
                  <ToggleBtn active={s.qtyMode === 'crypto'} onClick={() => {
                    if (s.qtyMode === 'usd') {
                      const v = parseFloat(s.qty), bp = parseFloat(s.buyPrice)
                      patch({ qtyMode: 'crypto', qty: (v > 0 && bp > 0) ? (v / bp).toFixed(6) : '' })
                    }
                  }}>En cripto</ToggleBtn>
                  <ToggleBtn active={s.qtyMode === 'usd'} onClick={() => {
                    if (s.qtyMode === 'crypto') {
                      const v = parseFloat(s.qty), bp = parseFloat(s.buyPrice)
                      patch({ qtyMode: 'usd', qty: (v > 0 && bp > 0) ? (v * bp).toFixed(2) : '' })
                    }
                  }}>En dólares (USDT)</ToggleBtn>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>
                  {s.qtyMode === 'crypto' ? 'Cantidad de cripto que compro' : 'Dólares que invierto'}
                </label>
                <Input value={s.qty} onChange={v => patch({ qty: v })}
                  placeholder={s.qtyMode === 'crypto' ? 'ej: 500' : 'ej: 100'}
                  suffix={s.qtyMode === 'crypto' ? 'unidades' : 'USDT'} />
                <div style={{ fontSize:10, color:C.dim, marginTop:5 }}>
                  {s.qtyMode === 'crypto' ? 'Cantidad de tokens que vas a comprar.' : 'Convierto esto a cantidad de cripto usando el precio de compra.'}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>Precio de compra (USDT)</label>
                <Input value={s.buyPrice} onChange={v => patch({ buyPrice: v })} placeholder="0.00" suffix="USDT" />
                <div style={{ fontSize:10, color:C.dim, marginTop:5 }}>Se autocompleta al tocar un ticker arriba, pero podés editarlo.</div>
              </div>

              <div style={{ display:'flex', border:`1px solid ${C.line}`, marginBottom:16 }}>
                <ToggleBtn active={s.mode === 'sell'} onClick={() => patch({ mode: 'sell' })}>Defino precio de venta</ToggleBtn>
                <ToggleBtn active={s.mode === 'pct'}  onClick={() => patch({ mode: 'pct' })}>Defino % ganancia deseado</ToggleBtn>
              </div>

              {s.mode === 'sell' && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>Precio de venta (USDT)</label>
                  <Input value={s.sellPrice} onChange={v => patch({ sellPrice: v })} placeholder="0.00" suffix="USDT" />
                </div>
              )}

              {s.mode === 'pct' && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>% de ganancia NETA deseada (después de fees)</label>
                  <Input value={s.targetPct} onChange={v => patch({ targetPct: v })} placeholder="ej: 5" suffix="%" />
                  <div style={{ fontSize:10, color:C.dim, marginTop:5 }}>Calculo a qué precio exacto tenés que vender para lograr ese % limpio.</div>
                </div>
              )}

              <div style={{ fontSize:10, color:C.dim, letterSpacing:'0.12em', textTransform:'uppercase', margin:'18px 0 10px', display:'flex', alignItems:'center', gap:8 }}>
                Fees
                <div style={{ flex:1, height:1, background:C.line }} />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:C.dim, marginBottom:6 }}>Fee de Binance por operación</label>
                <Input value={s.feePct} onChange={v => patch({ feePct: v })} placeholder="0.1" suffix="%" />
                <div style={{ fontSize:10, color:C.dim, marginTop:5 }}>Se aplica dos veces: al comprar y al vender. Si usás BNB para pagar fees suele ser 0.075%.</div>
              </div>

              {result.error && <div style={{ fontSize:11, color:C.red, marginTop:6 }}>{result.error}</div>}
            </div>
          </div>

          {/* RESULT */}
          <div style={{ background:C.panel, border:`1px solid ${C.line}` }}>
            <div style={{ padding:'20px 16px', borderBottom:`1px solid ${C.line}`, textAlign:'center' }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                Ganancia neta (después de fees)
              </div>
              <div style={{ fontSize:42, fontWeight:700, lineHeight:1, fontVariantNumeric:'tabular-nums', color: result.pnlUsd == null ? C.text : netPos ? C.green : C.red, transition:'color 0.2s ease' }}>
                {result.pnlUsd == null ? '0.00%' : (netPos ? '+' : '') + netPct.toFixed(2) + '%'}
              </div>
              <div style={{ fontSize:13, color:C.dim, marginTop:8, fontVariantNumeric:'tabular-nums' }}>
                {result.pnlUsd == null ? '$0.00 USDT' : (result.pnlUsd >= 0 ? '+' : '') + fmtUsd(result.pnlUsd)}
              </div>
            </div>

            <div style={{ padding:'4px 16px 16px' }}>
              <Row label="Cantidad de cripto comprada"      value={result.qty != null ? result.qty.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:6 }) : '—'} />
              <Row label="Invertido (compra + fee)"         value={result.totalInvested != null ? fmtUsd(result.totalInvested) : '—'} />
              <Row label="Fee de compra"                    value={result.feeBuy != null ? '-' + fmtUsd(result.feeBuy) : '—'} color={C.red} />
              <Row label="Bruto recibido al vender"         value={result.grossSell != null ? fmtUsd(result.grossSell) : '—'} />
              <Row label="Fee de venta"                     value={result.feeSell != null ? '-' + fmtUsd(result.feeSell) : '—'} color={C.red} />
              <Row label="Recibís neto (en mano)"           value={result.netReceived != null ? fmtUsd(result.netReceived) : '—'} />
              <Row label="Ganancia / pérdida en USDT"       value={result.pnlUsd != null ? (result.pnlUsd >= 0 ? '+' : '') + fmtUsd(result.pnlUsd) : '—'} color={result.pnlUsd != null ? (result.pnlUsd >= 0 ? C.green : C.red) : undefined} />
              <Row label="Precio de venta usado/calculado"  value={result.sellPrice != null ? fmtPrice(result.sellPrice) : '—'} color={C.amber} />
            </div>

            <div style={{ margin:'0 16px 16px', padding:'12px 14px', background:C.panel2, borderLeft:`3px solid ${C.amber}`, fontSize:12, lineHeight:1.5 }}>
              Precio de equilibrio (breakeven, ganancia 0%):{' '}
              <b style={{ color:C.amber }}>
                {result.breakeven != null
                  ? `${fmtPrice(result.breakeven)} (vs. compra ${fmtPrice(parseFloat(s.buyPrice))})`
                  : '—'}
              </b>
            </div>
          </div>
        </div>

        <div style={{ marginTop:24, fontSize:11, color:C.dim, lineHeight:1.7, borderTop:`1px solid ${C.line}`, paddingTop:14 }}>
          Los precios se cargan una vez al abrir la página desde la API pública de Binance. Si querés precios frescos, recargá la página. El cálculo asume operación spot sin apalancamiento. <code style={{ background:C.panel2, padding:'1px 5px', color:'#8a96a8' }}>MUB</code> es el bStock (acción tokenizada) de Micron en Binance, con fee por defecto de 0.15%.
        </div>

      </div>
    </div>
  )
}
