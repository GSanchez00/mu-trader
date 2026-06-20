const cache = {}

async function doFetch(symbol, range) {
  const res  = await fetch(`/api/candles/${symbol}?range=${range}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  const json = await res.json()
  if (json.chart?.error) throw new Error(json.chart.error.description)

  const result = json.chart.result?.[0]
  if (!result) throw new Error('Sin datos')

  const timestamps = result.timestamp
  const quote      = result.indicators.quote[0]

  return timestamps.map((ts, i) => ({
    date:   new Date(ts * 1000).toISOString().slice(0, 10),
    open:   +quote.open[i].toFixed(2),
    high:   +quote.high[i].toFixed(2),
    low:    +quote.low[i].toFixed(2),
    close:  +quote.close[i].toFixed(2),
    volume: quote.volume[i],
  }))
}

export function fetchCandles(symbol = 'MU', range = '1y') {
  const key = `${symbol}_${range}`
  if (!cache[key]) cache[key] = doFetch(symbol, range)
  return cache[key]
}
