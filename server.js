import express from 'express'
import fetch   from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

app.get('/api/candles/:symbol', async (req, res) => {
  const { symbol } = req.params
  const range = req.query.range ?? '1y'

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const json = await upstream.json()
    res.json(json)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Servir el frontend buildeado en producción
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

app.listen(PORT, () => console.log(`Server → http://localhost:${PORT}`))
