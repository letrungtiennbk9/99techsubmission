import React, { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const [rates, setRates] = useState({})
  const [tokens, setTokens] = useState([])
  const [amount, setAmount] = useState('100')
  const [token, setToken] = useState('')
  const [converted, setConverted] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [bgColor, setBgColor] = useState('transparent')
  const dropdownRef = useRef(null)

  // read page background color to use it for label/price text
  useEffect(() => {
    try {
      const comp = window.getComputedStyle(document.documentElement)
      const bg = comp.getPropertyValue('background-color') || 'transparent'
      setBgColor(bg.trim())
    } catch (e) {
      setBgColor('transparent')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch('https://interview.switcheo.com/prices.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // The API returns an array of price objects. Use the 'currency' field as key/label.
        if (!Array.isArray(data)) throw new Error('Unexpected data format')
        const map = {}
        const list = []
        const seen = new Set()
        for (const item of data) {
          const cur = item?.currency
          if (!cur) continue
          // always keep the latest item in the map, but only add the label once
          map[cur] = item
          if (!seen.has(cur)) {
            seen.add(cur)
            list.push(cur)
          }
        }
        const keys = list.sort()
        setRates(map)
        setTokens(keys)
        setToken((prev) => prev || keys[0] || '')
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load prices')
        setLoading(false)
      })
  }, [])  

  const getUsdPrice = (sym) => {
    console.log(sym, rates)
    return rates[sym]?.price 
  }

  const iconFor = (sym, ext = 'svg') => {
    // Use jsDelivr CDN for proper CORS headers to avoid CORB
    // Example: https://cdn.jsdelivr.net/gh/Switcheo/token-icons@main/tokens/USDC.svg
    if (!sym) return ''
    return `https://cdn.jsdelivr.net/gh/Switcheo/token-icons@main/tokens/${encodeURIComponent(sym)}.${ext}`
  }

  // pulse effect when token changes
  useEffect(() => {
    if (!token) return
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 350)
    return () => clearTimeout(t)
  }, [token])

  useEffect(() => {
    const usd = Number(amount)
    if (!token || Number.isNaN(usd)) {
      setConverted('')
      return
    }
    const price = getUsdPrice(token)
    if (price == null) {
      setConverted('')
      return
    }
    // New logic: converted = amount * price
    const result = usd * price
    setConverted(result)
  }, [amount, token, rates])

  const format = (v) => {
    if (v === '' || v == null || Number.isNaN(Number(v))) return ''
    const n = Number(v)
    if (Math.abs(n) < 0.000001) return n.toPrecision(6)
    return n.toLocaleString(undefined, { maximumFractionDigits: 8 })
  }

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return
      const el = dropdownRef.current
      if (el && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div style={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', maxWidth: 640, margin: '32px auto', padding: 20 }}>
      <h2 style={{ margin: '0 0 12px 0' }}>USD → Token converter</h2>

      {loading ? (
        <div>Loading rates…</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            Amount (USD)
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ marginTop: 6, padding: 8, fontSize: 16 }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ fontSize: 14, color: "white" }}>Destination token</div>
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
                padding: '8px 10px',
                fontSize: 16,
                textAlign: 'left',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              {token ? (
                <>
                  <img
                    src={iconFor(token)}
                    alt={token}
                    crossOrigin="anonymous"
                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                    onError={(e) => {
                      // try lowercase svg once, then stop trying and hide to prevent repeated 404s
                      const cur = e.currentTarget
                      if (!cur.dataset.triedLower) {
                        cur.dataset.triedLower = '1'
                        cur.onerror = null
                        cur.src = iconFor(token.toLowerCase(), 'svg')
                        return
                      }
                      cur.style.display = 'none'
                    }}
                  />
                  <span style={{ color: 'black' }}>{token}</span>
                </>
              ) : (
                <span style={{ color: '#666' }}>Select token</span>
              )}
              <span style={{ marginLeft: 'auto', color: '#888' }}>{open ? '▴' : '▾'}</span>
            </button>

            <div
              ref={dropdownRef}
              aria-hidden={!open}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: open ? 240 : 0,
                overflow: open ? 'auto' : 'hidden',
                border: '1px solid #ddd',
                background: '#fff',
                zIndex: 40,
                marginTop: 6,
                borderRadius: 6,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                transition: 'opacity 220ms ease, max-height 260ms ease',
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none'
              }}
            >
              {tokens.map((t) => (
                <div
                  key={t}
                  role="option"
                  onClick={() => {
                    setToken(t)
                    setOpen(false)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer', color: 'black' }}
                >
                  <img
                    src={iconFor(t)}
                    alt={t}
                    crossOrigin="anonymous"
                    style={{ width: 20, height: 20, objectFit: 'contain' }}
                    onError={(e) => {
                      // try lowercase svg once, then stop trying and hide
                      const cur = e.currentTarget
                      if (!cur.dataset.triedLower) {
                        cur.dataset.triedLower = '1'
                        cur.onerror = null
                        cur.src = iconFor(t.toLowerCase(), 'svg')
                        return
                      }
                      cur.style.display = 'none'
                    }}
                  />
                  <div style={{ fontSize: 14 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 14, color: "white" }}>Converted amount</div>
            <div
              style={{
                marginTop: 6,
                padding: 8,
                fontSize: 16,
                color: bgColor,
                background: pulse ? '#e9efff' : '#f7f7f7',
                borderRadius: 6,
                transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 250ms ease',
                transform: pulse ? 'scale(1.02)' : 'none',
                boxShadow: pulse ? '0 8px 22px rgba(100,108,255,0.14)' : 'none'
              }}
            >
              {format(converted) || '—'}
            </div>
          </div>

          <div style={{ color: '#666', fontSize: 13 }}>
            Prices: <a href="https://interview.switcheo.com/prices.json" target="_blank" rel="noreferrer">interview.switcheo.com/prices.json</a>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
