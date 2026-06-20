export function sma(values, period) {
  return values.map((_, i) => {
    if (i < period - 1) return null
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += values[j]
    return +(sum / period).toFixed(4)
  })
}

export function ema(values, period) {
  const k = 2 / (period + 1)
  const result = Array(values.length).fill(null)

  let start = 0
  while (start < values.length && values[start] == null) start++
  if (start + period > values.length) return result

  let sum = 0
  for (let i = start; i < start + period; i++) sum += values[i]
  result[start + period - 1] = sum / period

  for (let i = start + period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k)
  }

  return result.map(v => (v != null ? +v.toFixed(4) : null))
}

export function rsi(closes, period = 14) {
  const result = Array(closes.length).fill(null)
  if (closes.length < period + 1) return result

  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d > 0) gains += d
    else losses -= d
  }

  let ag = gains / period
  let al = losses / period

  const calc = (g, l) => (l === 0 ? 100 : +(100 - 100 / (1 + g / l)).toFixed(2))

  result[period] = calc(ag, al)

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period
    result[i] = calc(ag, al)
  }

  return result
}

export function bollingerBands(closes, period = 20, mult = 2) {
  const mid = sma(closes, period)
  return closes.map((_, i) => {
    if (mid[i] == null) return { upper: null, middle: null, lower: null }
    const slice = closes.slice(i - period + 1, i + 1)
    const variance = slice.reduce((acc, v) => acc + (v - mid[i]) ** 2, 0) / period
    const sd = Math.sqrt(variance)
    return {
      upper:  +(mid[i] + mult * sd).toFixed(4),
      middle: +mid[i].toFixed(4),
      lower:  +(mid[i] - mult * sd).toFixed(4),
    }
  })
}

export function macd(closes, fast = 12, slow = 26, signal = 9) {
  const fe = ema(closes, fast)
  const se = ema(closes, slow)

  const line = closes.map((_, i) =>
    fe[i] != null && se[i] != null ? +(fe[i] - se[i]).toFixed(4) : null
  )

  const sig = ema(line, signal)

  const hist = line.map((v, i) =>
    v != null && sig[i] != null ? +(v - sig[i]).toFixed(4) : null
  )

  return { line, signal: sig, histogram: hist }
}

export function computeAllIndicators(data) {
  const closes  = data.map(d => d.close)
  const volumes = data.map(d => d.volume)

  return {
    sma20:          sma(closes, 20),
    sma50:          sma(closes, 50),
    sma200:         sma(closes, 200),
    rsi:            rsi(closes, 14),
    bollingerBands: bollingerBands(closes, 20, 2),
    macd:           macd(closes),
    avgVolume20:    sma(volumes, 20),
  }
}
