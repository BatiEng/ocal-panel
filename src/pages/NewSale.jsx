import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function NewSale() {
  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [cart, setCart]         = useState([])
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.getProducts({ search, per_page: 30 })
      .then(({ data }) => setProducts(data.data))
  }, [search])

  const addToCart = (product) => {
    setCart(c => {
      const existing = c.find(i => i.product_id === product.id)
      if (existing) {
        return c.map(i => i.product_id === product.id
          ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unit_price }
          : i)
      }
      return [...c, {
        product_id:   product.id,
        product_name: product.name,
        unit_price:   Number(product.sell_price),
        qty:          1,
        subtotal:     Number(product.sell_price),
        max_stock:    product.stock_qty,
        unit:         product.unit,
      }]
    })
  }

  const updateQty = (productId, qty) => {
    const q = Math.max(0, parseInt(qty) || 0)
    if (q === 0) { setCart(c => c.filter(i => i.product_id !== productId)); return }
    setCart(c => c.map(i => i.product_id === productId
      ? { ...i, qty: q, subtotal: q * i.unit_price } : i))
  }

  const updatePrice = (productId, price) => {
    const p = Math.max(0, parseFloat(price) || 0)
    setCart(c => c.map(i => i.product_id === productId
      ? { ...i, unit_price: p, subtotal: i.qty * p } : i))
  }

  const total     = cart.reduce((s, i) => s + i.subtotal, 0)
  const finalAmt  = Math.max(0, total - Number(discount))

  const submit = async () => {
    if (!cart.length) return setError('Add at least one item')
    setError('')
    setLoading(true)
    try {
      const { data } = await api.createSale({
        customer_name:  customerName || null,
        payment_method: paymentMethod,
        discount:       Number(discount),
        notes:          notes || null,
        sale_date:      new Date().toISOString().split('T')[0],
        items: cart.map(i => ({
          product_id: i.product_id,
          qty:        i.qty,
          unit_price: i.unit_price,
        })),
      })
      alert(`✅ Sale ${data.data.sale_number} recorded! Total: $${Number(data.data.final_amount).toFixed(2)}`)
      navigate('/sales')
    } catch (err) {
      setError(err.response?.data?.message || 'Sale failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/sales')} className="text-gray-400 hover:text-gray-700">←</button>
        <h1 className="text-xl font-bold text-gray-900">New Sale</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Product picker */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Search & Add Products</p>
            <input type="text" placeholder="Search by name or SKU…" className="input mb-3"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {products.map(p => (
                <div key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => addToCart(p)}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category} · Stock: {p.stock_qty} {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">${Number(p.sell_price).toFixed(2)}</p>
                    {p.is_low_stock && <span className="text-xs text-red-500">Low stock</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Cart + order summary */}
        <div className="space-y-4">
          {/* Cart items */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Cart {cart.length > 0 && `(${cart.length} items)`}</p>
            {cart.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">Click a product to add it</p>
              : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">Qty:</span>
                          <input type="number" min="1" max={item.max_stock}
                            value={item.qty}
                            onChange={e => updateQty(item.product_id, e.target.value)}
                            className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center" />
                          <span className="text-xs text-gray-400">Price:</span>
                          <input type="number" step="0.01" min="0"
                            value={item.unit_price}
                            onChange={e => updatePrice(item.product_id, e.target.value)}
                            className="w-20 text-xs border border-gray-200 rounded px-1.5 py-0.5" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900">${item.subtotal.toFixed(2)}</p>
                        <button onClick={() => setCart(c => c.filter(i => i.product_id !== item.product_id))}
                          className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Order details */}
          <div className="card p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Order Details</p>
            <div>
              <label className="label">Customer Name</label>
              <input type="text" className="input" value={customerName}
                onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Payment</label>
                <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Discount ($)</label>
                <input type="number" min="0" step="0.01" className="input" value={discount}
                  onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <input type="text" className="input" value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>${total.toFixed(2)}</span>
              </div>
              {Number(discount) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span><span>-${Number(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                <span>Total</span><span>${finalAmt.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

            <button onClick={submit} disabled={loading || !cart.length}
              className="btn-primary w-full justify-center py-3 text-base">
              {loading ? 'Processing…' : `Complete Sale · $${finalAmt.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
