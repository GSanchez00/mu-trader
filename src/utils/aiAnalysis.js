export function generateAIAnalysis(data, ind) {
  if (!data.length) return null

  const n    = data.length - 1
  const lat  = data[n]
  const prev = data[n - 1]
  const c    = lat.close

  const rsiVal  = ind.rsi[n]
  const sma20   = ind.sma20[n]
  const sma50   = ind.sma50[n]
  const sma200  = ind.sma200[n]
  const bb      = ind.bollingerBands[n]
  const macdL   = ind.macd.line[n]
  const macdS   = ind.macd.signal[n]
  const macdH   = ind.macd.histogram[n]
  const avgVol  = ind.avgVolume20[n]

  const signals = []
  let bull = 0, bear = 0

  // RSI
  if (rsiVal != null) {
    if (rsiVal < 30) {
      signals.push({ side: 'bull', w: 3, label: 'RSI Sobrevendido', desc: `RSI en ${rsiVal.toFixed(1)} — zona de reversión alcista histórica` })
      bull += 3
    } else if (rsiVal < 45) {
      signals.push({ side: 'bear', w: 1, label: 'RSI Débil', desc: `RSI en ${rsiVal.toFixed(1)} — momentum bajista leve` })
      bear += 1
    } else if (rsiVal > 70) {
      signals.push({ side: 'bear', w: 3, label: 'RSI Sobrecomprado', desc: `RSI en ${rsiVal.toFixed(1)} — zona de posible corrección` })
      bear += 3
    } else if (rsiVal > 55) {
      signals.push({ side: 'bull', w: 2, label: 'RSI en Zona Alcista', desc: `RSI en ${rsiVal.toFixed(1)} — momentum positivo sostenido` })
      bull += 2
    } else {
      signals.push({ side: 'neutral', w: 0, label: 'RSI Neutro', desc: `RSI en ${rsiVal.toFixed(1)} — sin señal direccional clara` })
    }
  }

  // SMA 200 (tendencia de largo plazo)
  if (sma200 != null) {
    if (c > sma200) {
      signals.push({ side: 'bull', w: 3, label: 'Sobre MM200', desc: `Precio ($${c.toFixed(2)}) por encima de la MM200 ($${sma200.toFixed(2)}) — tendencia alcista de largo plazo` })
      bull += 3
    } else {
      signals.push({ side: 'bear', w: 3, label: 'Bajo MM200', desc: `Precio ($${c.toFixed(2)}) por debajo de la MM200 ($${sma200.toFixed(2)}) — tendencia bajista de largo plazo` })
      bear += 3
    }
  }

  // Cruce MM20/MM50
  if (sma20 != null && sma50 != null) {
    if (sma20 > sma50) {
      signals.push({ side: 'bull', w: 2, label: 'Cruce Dorado', desc: `MM20 ($${sma20.toFixed(2)}) sobre MM50 ($${sma50.toFixed(2)}) — patrón de cruce alcista activo` })
      bull += 2
    } else {
      signals.push({ side: 'bear', w: 2, label: 'Cruce de la Muerte', desc: `MM20 ($${sma20.toFixed(2)}) bajo MM50 ($${sma50.toFixed(2)}) — patrón de cruce bajista activo` })
      bear += 2
    }
  }

  // Bollinger Bands
  if (bb?.upper != null) {
    if (c > bb.upper) {
      signals.push({ side: 'bear', w: 2, label: 'Sobre Banda Superior BB', desc: `Precio supera la banda superior ($${bb.upper.toFixed(2)}) — posible reversión a la media` })
      bear += 2
    } else if (c < bb.lower) {
      signals.push({ side: 'bull', w: 2, label: 'Bajo Banda Inferior BB', desc: `Precio bajo la banda inferior ($${bb.lower.toFixed(2)}) — alta probabilidad de rebote` })
      bull += 2
    } else if (c > bb.middle) {
      signals.push({ side: 'bull', w: 1, label: 'Mitad Superior BB', desc: 'Precio en zona alcista dentro de las Bandas de Bollinger' })
      bull += 1
    } else {
      signals.push({ side: 'bear', w: 1, label: 'Mitad Inferior BB', desc: 'Precio en zona bajista dentro de las Bandas de Bollinger' })
      bear += 1
    }
  }

  // MACD
  if (macdL != null && macdS != null) {
    if (macdL > macdS) {
      const fuerza = Math.abs(macdH ?? 0) > 0.4 ? 'fuerte momentum' : 'momentum moderado'
      signals.push({ side: 'bull', w: 2, label: 'MACD Alcista', desc: `MACD (${macdL.toFixed(3)}) sobre la señal (${macdS.toFixed(3)}) con ${fuerza}` })
      bull += 2
    } else {
      const fuerza = Math.abs(macdH ?? 0) > 0.4 ? 'fuerte momentum' : 'momentum moderado'
      signals.push({ side: 'bear', w: 2, label: 'MACD Bajista', desc: `MACD (${macdL.toFixed(3)}) bajo la señal (${macdS.toFixed(3)}) con ${fuerza}` })
      bear += 2
    }
  }

  // Volumen
  if (avgVol != null) {
    const ratio = lat.volume / avgVol
    if (ratio > 1.5) {
      const alcista = c > (prev?.close ?? c)
      if (alcista) {
        signals.push({ side: 'bull', w: 1, label: 'Volumen Alcista Elevado', desc: `Volumen ${((ratio - 1) * 100).toFixed(0)}% sobre la media con cierre positivo — compradores activos` })
        bull += 1
      } else {
        signals.push({ side: 'bear', w: 1, label: 'Volumen Bajista Elevado', desc: `Volumen ${((ratio - 1) * 100).toFixed(0)}% sobre la media con cierre negativo — vendedores activos` })
        bear += 1
      }
    }
  }

  const total   = bull + bear || 1
  const bullPct = (bull / total) * 100

  let recommendation, confidence, color
  if      (bullPct >= 72) { recommendation = 'COMPRA FUERTE';  confidence = bullPct;          color = '#00d4aa' }
  else if (bullPct >= 58) { recommendation = 'COMPRAR';        confidence = bullPct;          color = '#34d399' }
  else if (bullPct >= 43) { recommendation = 'MANTENER';       confidence = 50;               color = '#fbbf24' }
  else if (bullPct >= 28) { recommendation = 'VENDER';         confidence = 100 - bullPct;    color = '#f87171' }
  else                    { recommendation = 'VENTA FUERTE';   confidence = 100 - bullPct;    color = '#ef4444' }

  const trend   = c > (sma50 ?? c) ? 'alcista' : 'bajista'
  const rsiTxt  = rsiVal == null ? 'N/A'
                : rsiVal < 30   ? 'sobrevendido'
                : rsiVal > 70   ? 'sobrecomprado'
                : `en zona neutra (${rsiVal.toFixed(1)})`

  const bullSigs = signals.filter(s => s.side === 'bull').length
  const bearSigs = signals.filter(s => s.side === 'bear').length

  const summary =
    `MU — Micron Technology cotiza a $${c.toFixed(2)}, en tendencia ${trend}. ` +
    `El motor de análisis detectó ${bullSigs} señales alcistas y ${bearSigs} bajistas. ` +
    `El RSI está ${rsiTxt}. ` +
    (recommendation.includes('COMPRA')
      ? 'Los indicadores de momentum y tendencia convergen favorablemente. Los niveles técnicos de soporte sostienen el movimiento actual.'
      : recommendation === 'MANTENER'
      ? 'Las señales son mixtas. Se aconseja aguardar confirmación antes de tomar posición nueva.'
      : 'La debilidad técnica es generalizada. Se recomienda precaución y evaluar niveles de salida.')

  return {
    recommendation,
    confidence: +confidence.toFixed(1),
    color,
    signals,
    bullScore: bull,
    bearScore: bear,
    bullPct:   +bullPct.toFixed(1),
    summary,
    rsiVal,
    sma20,
    sma50,
    sma200,
    bb,
    macdL,
    macdS,
    latestVolume: lat.volume,
    avgVolume:    avgVol,
  }
}
