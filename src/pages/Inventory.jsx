import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const UNITS = ['adet','kutu','paket','kg','gram','metre','litre','takım','çift','rulo']

function StockModal({ product, onClose, onDone }) {
  const [type, setType]     = useState('in')
  const [qty, setQty]       = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = type === 'in' ? api.stockIn : api.stockOut
      await fn({ product_id: product.id, qty: parseInt(qty), reason })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'İşlem başarısız')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Stok Güncelle — {product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Mevcut stok: <strong>{product.stock_qty}</strong> {product.unit}</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
          <div className="flex gap-2">
            {['in','out'].map(t => (
              <button key={t} type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  type === t ? (t==='in' ? 'bg-green-600 text-white border-green-600' : 'bg-red-500 text-white border-red-500')
                             : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {t === 'in' ? '+ Stok Girişi' : '− Stok Çıkışı'}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Miktar</label>
            <input type="number" min="1" className="input" value={qty}
              onChange={e => setQty(e.target.value)} required placeholder="0" />
          </div>
          <div>
            <label className="label">Açıklama</label>
            <input type="text" className="input" value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={type === 'in' ? 'örn. Satın alma / Yenileme' : 'örn. Hasarlı / İade'} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" disabled={loading}
              className={`flex-1 justify-center btn ${type==='in' ? 'btn-success' : 'btn-danger'}`}>
              {loading ? 'Kaydediliyor…' : `${type === 'in' ? 'Giriş Onayla' : 'Çıkış Onayla'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductModal({ product, categories, onClose, onDone }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    category_id: product?.category_id || categories[0]?.id || '',
    name:        product?.name        || '',
    sku:         product?.sku         || '',
    description: product?.description || '',
    cost_price:  product?.cost_price  || '',
    sell_price:  product?.sell_price  || '',
    stock_qty:   product?.stock_qty   || 0,
    min_stock:   product?.min_stock   || 5,
    unit:        product?.unit        || 'adet',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await api.updateProduct(product.id, form)
      } else {
        await api.createProduct(form)
      }
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Ürün kaydedilemedi')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-gray-900">{isEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          <div>
            <label className="label">Kategori *</label>
            <select className="input" value={form.category_id}
              onChange={e => setF('category_id', e.target.value)} required>
              <option value="">Kategori seçin</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Ürün Adı *</label>
              <input type="text" className="input" value={form.name}
                onChange={e => setF('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input type="text" className="input" value={form.sku}
                onChange={e => setF('sku', e.target.value)} placeholder="Otomatik oluşturulur" />
            </div>
            <div>
              <label className="label">Birim</label>
              <select className="input" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Alış Fiyatı</label>
              <input type="number" step="0.01" min="0" className="input" value={form.cost_price}
                onChange={e => setF('cost_price', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Satış Fiyatı *</label>
              <input type="number" step="0.01" min="0" className="input" value={form.sell_price}
                onChange={e => setF('sell_price', e.target.value)} required placeholder="0.00" />
            </div>
            {!isEdit && (
              <div>
                <label className="label">Başlangıç Stoğu</label>
                <input type="number" min="0" className="input" value={form.stock_qty}
                  onChange={e => setF('stock_qty', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Min. Stok (uyarı)</label>
              <input type="number" min="0" className="input" value={form.min_stock}
                onChange={e => setF('min_stock', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Açıklama</label>
            <textarea className="input" rows={2} value={form.description}
              onChange={e => setF('description', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Kaydediliyor…' : isEdit ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStock, setLowStock]   = useState(false)
  const [page, setPage]       = useState(1)
  const [stockModal, setStockModal]     = useState(null)
  const [productModal, setProductModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getProducts({ search, category_id: catFilter, low_stock: lowStock ? 1 : 0, page, per_page: 20 })
      .then(({ data }) => { setProducts(data.data); setPagination(data.pagination) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, catFilter, lowStock, page])

  useEffect(() => {
    api.getCategories().then(({ data }) => setCategories(data.data))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
    await api.deleteProduct(id)
    load()
  }

  return (
    <div className="p-6 space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Stok Yönetimi</h1>
        <button onClick={() => setProductModal({})} className="btn-primary">+ Ürün Ekle</button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Ürün ara…" className="input w-56"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input w-44" value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">Tüm kategoriler</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={lowStock}
            onChange={e => { setLowStock(e.target.checked); setPage(1) }}
            className="rounded border-gray-300" />
          Sadece kritik stok
        </label>
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['SKU','Ürün','Kategori','Stok','Fiyat',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? <tr><td colSpan="6" className="text-center py-12 text-gray-400">Yükleniyor…</td></tr>
              : products.length === 0
              ? <tr><td colSpan="6" className="text-center py-12 text-gray-400">Ürün bulunamadı</td></tr>
              : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="badge bg-gray-100 text-gray-600">{p.category_icon} {p.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${p.is_low_stock == 1 ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stock_qty}
                      </span>
                      <span className="text-gray-400 text-xs">{p.unit}</span>
                      {p.is_low_stock == 1 && <span className="badge bg-red-100 text-red-700 text-xs">Kritik</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">₺{Number(p.sell_price).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Alış: ₺{Number(p.cost_price).toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setStockModal(p)}
                        className="btn-secondary px-2 py-1 text-xs">Stok</button>
                      <button onClick={() => setProductModal(p)}
                        className="btn-secondary px-2 py-1 text-xs">Düzenle</button>
                      <button onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors">✕</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Sayfalama */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {pagination.total} ürün · Sayfa {pagination.current_page} / {pagination.last_page}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">← Önceki</button>
              <button disabled={page === pagination.last_page} onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Sonraki →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modaller */}
      {stockModal && (
        <StockModal product={stockModal} onClose={() => setStockModal(null)}
          onDone={() => { setStockModal(null); load() }} />
      )}
      {productModal !== null && (
        <ProductModal
          product={productModal?.id ? productModal : null}
          categories={categories}
          onClose={() => setProductModal(null)}
          onDone={() => { setProductModal(null); load() }}
        />
      )}
    </div>
  )
}
