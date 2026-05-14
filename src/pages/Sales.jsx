import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const METHOD_BADGE = {
  cash:     'bg-green-100 text-green-700',
  card:     'bg-blue-100 text-blue-700',
  transfer: 'bg-purple-100 text-purple-700',
  other:    'bg-gray-100 text-gray-600',
}
const METHOD_LABEL = { cash: 'Nakit', card: 'Kart', transfer: 'Havale', other: 'Diğer' }

// ── Customer search dropdown ───────────────────────────────
function CustomerPicker({ value, onChange }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    api.searchCustomers(query).then(r => setResults(r.data.data))
  }, [query])

  const pick = (c) => { setSelected(c); onChange(c); setQuery(c.name); setOpen(false); setResults([]) }
  const clear = () => { setSelected(null); onChange(null); setQuery('') }

  return (
    <div className="relative">
      <div className="flex gap-1">
        <input className="input flex-1" placeholder="Müşteri ara veya isim yaz…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (selected) clear() }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} />
        {selected && <button onClick={clear} className="px-2 text-gray-400 hover:text-red-500">✕</button>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map(c => (
            <div key={c.id} onMouseDown={() => pick(c)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
              <p className="font-medium text-gray-900">{c.name}</p>
              {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sale detail popup ──────────────────────────────────────
function SaleDetail({ saleId, onClose }) {
  const [sale, setSale] = useState(null)
  useEffect(() => { api.getSale(saleId).then(r => setSale(r.data.data)) }, [saleId])

  if (!sale) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-gray-400 text-sm">Yükleniyor…</div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className="font-semibold text-gray-900">{sale.sale_number}</p>
            <p className="text-xs text-gray-400">{sale.sale_date} · {sale.cashier}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {sale.customer_name && (
            <p className="text-sm text-gray-600">Müşteri: <strong>{sale.customer_name}</strong></p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">Ürün</th>
                  <th className="text-center pb-2">Adet</th>
                  <th className="text-right pb-2">Fiyat</th>
                  <th className="text-right pb-2">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sale.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-700">{item.product_name}</td>
                    <td className="py-2 text-center text-gray-500">{item.qty}</td>
                    <td className="py-2 text-right text-gray-500">₺{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">₺{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Ara Toplam</span><span>₺{Number(sale.total_amount).toFixed(2)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-red-500">
                <span>İndirim</span><span>-₺{Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Toplam</span><span>₺{Number(sale.final_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 pt-1">
              <span>Ödeme</span>
              <span className={`badge ${METHOD_BADGE[sale.payment_method]}`}>
                {METHOD_LABEL[sale.payment_method] || sale.payment_method}
              </span>
            </div>
          </div>
          {sale.notes && <p className="text-xs text-gray-400 italic">Not: {sale.notes}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Main Sales page ────────────────────────────────────────
export default function Sales() {
  // Mobile tab: 'products' | 'cart' | 'history'
  const [mobileTab, setMobileTab] = useState('products')

  // POS state
  const [products, setProducts]     = useState([])
  const [prodSearch, setProdSearch] = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [categories, setCategories] = useState([])
  const [cart, setCart]             = useState([])
  const [customer, setCustomer]     = useState(null)
  const [payment, setPayment]       = useState('cash')
  const [discount, setDiscount]     = useState('')
  const [notes, setNotes]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [posError, setPosError]     = useState('')

  // History state
  const [sales, setSales]           = useState([])
  const [pagination, setPagination] = useState({})
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [page, setPage]             = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [detail, setDetail]         = useState(null)

  useEffect(() => {
    api.getCategories().then(r => setCategories(r.data.data))
  }, [])

  useEffect(() => {
    api.getProducts({ search: prodSearch, category_id: catFilter, per_page: 40 })
      .then(r => setProducts(r.data.data))
  }, [prodSearch, catFilter])

  const loadHistory = useCallback(() => {
    setLoadingHistory(true)
    api.getSales({ from, to, page })
      .then(r => { setSales(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoadingHistory(false))
  }, [from, to, page])

  useEffect(() => { loadHistory() }, [loadHistory])

  const addToCart = (product) => {
    if (product.stock_qty < 1) return
    setCart(c => {
      const ex = c.find(i => i.product_id === product.id)
      if (ex) {
        if (ex.qty >= product.stock_qty) return c
        return c.map(i => i.product_id === product.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unit_price } : i)
      }
      return [...c, {
        product_id: product.id, product_name: product.name,
        unit_price: Number(product.sell_price), qty: 1,
        subtotal: Number(product.sell_price), max_stock: product.stock_qty,
        unit: product.unit,
      }]
    })
  }

  const updateQty = (id, qty) => {
    const q = Math.max(0, parseInt(qty) || 0)
    if (q === 0) { setCart(c => c.filter(i => i.product_id !== id)); return }
    setCart(c => c.map(i => i.product_id === id ? { ...i, qty: q, subtotal: q * i.unit_price } : i))
  }

  const updatePrice = (id, price) => {
    const p = Math.max(0, parseFloat(price) || 0)
    setCart(c => c.map(i => i.product_id === id ? { ...i, unit_price: p, subtotal: i.qty * p } : i))
  }

  const totalAmount = cart.reduce((s, i) => s + i.subtotal, 0)
  const finalAmount = Math.max(0, totalAmount - (parseFloat(discount) || 0))

  const submitSale = async () => {
    if (!cart.length) { setPosError('Sepete en az bir ürün ekleyin'); return }
    setPosError('')
    setSubmitting(true)
    try {
      const { data } = await api.createSale({
        customer_id:    customer?.id   ?? null,
        customer_name:  customer?.name ?? null,
        payment_method: payment,
        discount:       parseFloat(discount) || 0,
        notes:          notes || null,
        sale_date:      new Date().toISOString().split('T')[0],
        items: cart.map(i => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })),
      })
      setCart([]); setCustomer(null); setDiscount(''); setNotes(''); setPayment('cash')
      loadHistory()
      alert(`✅ Satış kaydedildi: ${data.data.sale_number}\nToplam: ₺${Number(data.data.final_amount).toFixed(2)}`)
      setMobileTab('history')
    } catch (err) {
      setPosError(err.response?.data?.message || 'Satış başarısız')
    } finally { setSubmitting(false) }
  }

  // ── Product panel ──────────────────────────────────────────
  const ProductPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex gap-2">
          <input placeholder="Ürün ara…" className="input flex-1 text-sm"
            value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
          <select className="input w-32 text-sm" value={catFilter}
            onChange={e => setCatFilter(e.target.value)}>
            <option value="">Tüm</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {products.map(p => (
            <button key={p.id} onClick={() => { addToCart(p); setMobileTab('cart') }}
              disabled={p.stock_qty < 1}
              className={`text-left p-3 rounded-xl border transition-all ${
                p.stock_qty < 1
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 active:scale-95'
              }`}>
              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.category_icon} {p.category}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-base font-bold text-blue-600">₺{Number(p.sell_price).toFixed(2)}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                  p.stock_qty <= p.min_stock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>Stok: {p.stock_qty}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Cart panel ─────────────────────────────────────────────
  const CartPanel = (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="p-3 border-b border-gray-100 bg-white">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Müşteri</p>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {cart.length === 0
          ? <div className="text-center py-10 text-gray-300 text-sm">Ürüne tıklayarak ekle</div>
          : cart.map(item => (
            <div key={item.product_id} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{item.product_name}</p>
                <button onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))}
                  className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                    className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm">−</button>
                  <span className="px-2 text-sm font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                    disabled={item.qty >= item.max_stock}
                    className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-30">+</button>
                </div>
                <input type="number" step="0.01" min="0" value={item.unit_price}
                  onChange={e => updatePrice(item.product_id, e.target.value)}
                  className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center" />
                <span className="ml-auto text-sm font-bold text-gray-900">₺{item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))
        }
      </div>

      <div className="p-3 bg-white border-t border-gray-100 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="label text-xs">Ödeme</label>
            <select className="input text-sm" value={payment} onChange={e => setPayment(e.target.value)}>
              <option value="cash">Nakit</option>
              <option value="card">Kart</option>
              <option value="transfer">Havale</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <div className="w-24">
            <label className="label text-xs">İndirim (₺)</label>
            <input type="number" min="0" step="0.01" className="input text-sm"
              value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className="label text-xs">Not</label>
          <input className="input text-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="İsteğe bağlı" />
        </div>
        <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Ara toplam</span><span>₺{totalAmount.toFixed(2)}</span>
          </div>
          {parseFloat(discount) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>İndirim</span><span>-₺{parseFloat(discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
            <span>TOPLAM</span><span>₺{finalAmount.toFixed(2)}</span>
          </div>
        </div>
        {posError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{posError}</p>}
        <button onClick={submitSale} disabled={submitting || !cart.length}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
          {submitting ? 'Kaydediliyor…' : `✓ Satışı Tamamla · ₺${finalAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  )

  // ── History panel ──────────────────────────────────────────
  const HistoryPanel = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-white shrink-0 flex-wrap">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Satış Geçmişi</p>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <input type="date" className="input text-xs py-1 w-32" value={from}
            onChange={e => { setFrom(e.target.value); setPage(1) }} />
          <input type="date" className="input text-xs py-1 w-32" value={to}
            onChange={e => { setTo(e.target.value); setPage(1) }} />
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-700">Temizle</button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {['Satış No','Tarih','Müşteri','Tutar','Ödeme',''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loadingHistory
              ? <tr><td colSpan="6" className="text-center py-6 text-gray-400 text-xs">Yükleniyor…</td></tr>
              : sales.length === 0
              ? <tr><td colSpan="6" className="text-center py-6 text-gray-400 text-xs">Satış bulunamadı</td></tr>
              : sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setDetail(s.id)}>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{s.sale_number}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{s.sale_date}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{s.customer_name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900">₺{Number(s.final_amount).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`badge text-xs ${METHOD_BADGE[s.payment_method]}`}>
                      {METHOD_LABEL[s.payment_method] || s.payment_method}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-blue-500">Detay</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {pagination.last_page > 1 && (
        <div className="flex justify-end gap-1 px-3 py-2 border-t border-gray-100 shrink-0">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">←</button>
          <span className="text-xs text-gray-400 px-2 py-1">{page}/{pagination.last_page}</span>
          <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Mobile tab bar ── */}
      <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
        {[
          { key: 'products', label: 'Ürünler' },
          { key: 'cart',     label: `Sepet${cart.length > 0 ? ` (${cart.length})` : ''}` },
          { key: 'history',  label: 'Geçmiş' },
        ].map(t => (
          <button key={t.key} onClick={() => setMobileTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              mobileTab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Mobile views ── */}
      <div className="md:hidden flex-1 overflow-hidden">
        {mobileTab === 'products' && ProductPanel}
        {mobileTab === 'cart'     && CartPanel}
        {mobileTab === 'history'  && HistoryPanel}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex flex-1 min-h-0 border-b border-gray-200">
        {/* Left: Products */}
        <div className="w-[55%] flex flex-col border-r border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ürün Seç</p>
            <div className="flex gap-2">
              <input placeholder="Ürün ara…" className="input flex-1 text-sm"
                value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
              <select className="input w-36 text-sm" value={catFilter}
                onChange={e => setCatFilter(e.target.value)}>
                <option value="">Tüm kategoriler</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {products.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  disabled={p.stock_qty < 1}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    p.stock_qty < 1
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 active:scale-95'
                  }`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category_icon} {p.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-bold text-blue-600">₺{Number(p.sell_price).toFixed(2)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                      p.stock_qty <= p.min_stock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>Stok: {p.stock_qty}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-[45%] flex flex-col overflow-hidden bg-gray-50">
          <div className="p-4 border-b border-gray-100 bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Müşteri</p>
            <CustomerPicker value={customer} onChange={setCustomer} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {cart.length === 0
              ? <div className="text-center py-10 text-gray-300 text-sm">Ürüne tıklayarak ekle</div>
              : cart.map(item => (
                <div key={item.product_id} className="bg-white rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{item.product_name}</p>
                    <button onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">Adet</span>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                        className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm">−</button>
                      <span className="px-2 text-sm font-medium">{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                        disabled={item.qty >= item.max_stock}
                        className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm disabled:opacity-30">+</button>
                    </div>
                    <span className="text-xs text-gray-400">Birim fiyat</span>
                    <input type="number" step="0.01" min="0" value={item.unit_price}
                      onChange={e => updatePrice(item.product_id, e.target.value)}
                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center" />
                    <span className="ml-auto text-sm font-bold text-gray-900">₺{item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label text-xs">Ödeme</label>
                <select className="input text-sm" value={payment} onChange={e => setPayment(e.target.value)}>
                  <option value="cash">Nakit</option>
                  <option value="card">Kart</option>
                  <option value="transfer">Havale</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              <div className="w-28">
                <label className="label text-xs">İndirim (₺)</label>
                <input type="number" min="0" step="0.01" className="input text-sm"
                  value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label text-xs">Not</label>
              <input className="input text-sm" value={notes} onChange={e => setNotes(e.target.value)} placeholder="İsteğe bağlı" />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Ara toplam</span><span>₺{totalAmount.toFixed(2)}</span>
              </div>
              {parseFloat(discount) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>İndirim</span><span>-₺{parseFloat(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                <span>TOPLAM</span><span>₺{finalAmount.toFixed(2)}</span>
              </div>
            </div>
            {posError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{posError}</p>}
            <button onClick={submitSale} disabled={submitting || !cart.length}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
              {submitting ? 'Kaydediliyor…' : `✓ Satışı Tamamla · ₺${finalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop: Sales history ── */}
      <div className="hidden md:flex flex-col" style={{ maxHeight: '38%' }}>
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Satış Geçmişi</p>
          <div className="flex items-center gap-2 ml-auto">
            <input type="date" className="input text-xs py-1 w-32" value={from}
              onChange={e => { setFrom(e.target.value); setPage(1) }} />
            <input type="date" className="input text-xs py-1 w-32" value={to}
              onChange={e => { setTo(e.target.value); setPage(1) }} />
            {(from || to) && (
              <button onClick={() => { setFrom(''); setTo(''); setPage(1) }}
                className="text-xs text-gray-400 hover:text-gray-700">Temizle</button>
            )}
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['Satış No','Tarih','Müşteri','Tutar','Ödeme',''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingHistory
                ? <tr><td colSpan="6" className="text-center py-6 text-gray-400 text-xs">Yükleniyor…</td></tr>
                : sales.length === 0
                ? <tr><td colSpan="6" className="text-center py-6 text-gray-400 text-xs">Satış bulunamadı</td></tr>
                : sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setDetail(s.id)}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500">{s.sale_number}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{s.sale_date}</td>
                    <td className="px-4 py-2 text-xs text-gray-700">{s.customer_name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900">₺{Number(s.final_amount).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`badge text-xs ${METHOD_BADGE[s.payment_method]}`}>
                        {METHOD_LABEL[s.payment_method] || s.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-blue-500">Detay</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {pagination.last_page > 1 && (
          <div className="flex justify-end gap-1 px-4 py-2 border-t border-gray-100 shrink-0">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">←</button>
            <span className="text-xs text-gray-400 px-2 py-1">{page}/{pagination.last_page}</span>
            <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
              className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">→</button>
          </div>
        )}
      </div>

      {detail && <SaleDetail saleId={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
