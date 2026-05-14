import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const STATUS_BADGE = {
  pending:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  paid:        'bg-purple-100 text-purple-700',
  cancelled:   'bg-gray-100 text-gray-500',
}
const STATUS_LABEL = {
  pending: 'Bekliyor', in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı', paid: 'Ödendi', cancelled: 'İptal',
}

// ── Customer search dropdown (reusable) ────────────────────
function CustomerPicker({ value, onChange }) {
  const [query, setQuery]   = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    api.searchCustomers(query).then(r => setResults(r.data.data))
  }, [query])

  const pick = (c) => { onChange(c); setQuery(c.name); setOpen(false); setResults([]) }
  const clear = () => { onChange(null); setQuery('') }

  return (
    <div className="relative">
      <div className="flex gap-1">
        <input className="input flex-1" placeholder="Müşteri ara…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (value) clear() }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} />
        {value && <button onClick={clear} className="px-2 text-gray-400 hover:text-red-500">✕</button>}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
          {results.map(c => (
            <div key={c.id} onMouseDown={() => pick(c)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm">
              <p className="font-medium">{c.name}</p>
              {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 1: New Job modal (name + phone + description only) ─
function NewJobModal({ onClose, onDone }) {
  const [customer, setCustomer] = useState(null)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', job_type: 'pump_repair', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCustomerPick = (c) => {
    setCustomer(c)
    if (c) { setF('customer_name', c.name); setF('customer_phone', c.phone || '') }
    else   { setF('customer_name', ''); setF('customer_phone', '') }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.customer_name.trim()) { setError('Müşteri adı gerekli'); return }
    if (!form.description.trim())   { setError('Açıklama gerekli'); return }
    setError('')
    setLoading(true)
    try {
      await api.createService({
        customer_id:    customer?.id   ?? null,
        customer_name:  form.customer_name,
        customer_phone: form.customer_phone || null,
        job_type:       form.job_type,
        description:    form.description,
      })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Yeni İş Emri</h3>
          <p className="text-xs text-gray-400 mt-0.5">İş başlatıldığında beklemede kalır, tamamlanınca detaylar girilir</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="label">Kayıtlı Müşteri Seç (isteğe bağlı)</label>
            <CustomerPicker value={customer} onChange={handleCustomerPick} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Müşteri Adı *</label>
              <input className="input" value={form.customer_name}
                onChange={e => setF('customer_name', e.target.value)}
                placeholder="Ad Soyad" required />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" value={form.customer_phone}
                onChange={e => setF('customer_phone', e.target.value)} placeholder="05xx xxx xx xx" />
            </div>
            <div>
              <label className="label">İş Tipi</label>
              <select className="input" value={form.job_type} onChange={e => setF('job_type', e.target.value)}>
                <option value="pump_repair">Pompa Tamiri</option>
                <option value="copper_rewinding">Bakır Sargı</option>
                <option value="electrical">Elektrik İşi</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Açıklama / Arıza *</label>
            <textarea className="input" rows={3} value={form.description}
              onChange={e => setF('description', e.target.value)}
              placeholder="Yapılacak iş veya arıza açıklaması…" required />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Kaydediliyor…' : 'İş Emri Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Step 2: Complete job modal (parts + labor + notes) ─────
function CompleteModal({ job, onClose, onDone }) {
  const [parts, setParts]       = useState([])
  const [laborCost, setLabor]   = useState('')
  const [notes, setNotes]       = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.getProducts({ per_page: 100 }).then(r => setProducts(r.data.data))
  }, [])

  const addPart = () => setParts(p => [...p, { product_id: '', custom_desc: '', qty: 1, unit_cost: '' }])
  const removePart = (i) => setParts(p => p.filter((_, idx) => idx !== i))
  const setPart = (i, k, v) => setParts(p => p.map((pt, idx) => idx === i ? { ...pt, [k]: v } : pt))

  const handleProductSelect = (i, productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    setParts(pts => pts.map((pt, idx) => idx !== i ? pt : {
      ...pt, product_id: productId,
      unit_cost: product ? String(product.cost_price) : '',
    }))
  }

  const partsTotal = parts.reduce((s, p) => s + (parseFloat(p.unit_cost)||0) * (parseInt(p.qty)||0), 0)
  const totalCost  = partsTotal + (parseFloat(laborCost) || 0)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.completeService(job.id, {
        labor_cost: parseFloat(laborCost) || 0,
        notes:      notes || null,
        parts: parts
          .filter(p => p.product_id || p.custom_desc)
          .map(p => ({
            product_id:  p.product_id ? parseInt(p.product_id) : null,
            custom_desc: p.custom_desc || null,
            qty:         parseInt(p.qty) || 1,
            unit_cost:   parseFloat(p.unit_cost) || 0,
          })),
      })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">İşi Tamamla — {job.job_number}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{job.customer_name} · {job.description}</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Parts */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kullanılan Parçalar</p>
              <button type="button" onClick={addPart} className="btn-secondary text-xs px-2 py-1">+ Parça Ekle</button>
            </div>

            {parts.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">Parça kullanılmadıysa boş bırakın</p>
            )}

            {parts.map((part, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <select className="input text-xs" value={part.product_id}
                    onChange={e => handleProductSelect(i, e.target.value)}>
                    <option value="">Stoktan seç / Özel</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (stok: {p.stock_qty})</option>
                    ))}
                  </select>
                </div>
                {!part.product_id && (
                  <div className="col-span-3">
                    <input type="text" placeholder="Parça adı" className="input text-xs"
                      value={part.custom_desc} onChange={e => setPart(i, 'custom_desc', e.target.value)} />
                  </div>
                )}
                <div className={part.product_id ? 'col-span-3' : 'col-span-2'}>
                  <input type="number" min="1" placeholder="Adet" className="input text-xs"
                    value={part.qty} onChange={e => setPart(i, 'qty', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <input type="number" step="0.01" min="0" placeholder="Maliyet $" className="input text-xs"
                    value={part.unit_cost} onChange={e => setPart(i, 'unit_cost', e.target.value)} />
                </div>
                <button type="button" onClick={() => removePart(i)}
                  className="col-span-1 text-red-400 hover:text-red-600 text-xl leading-none text-center">×</button>
              </div>
            ))}

            {parts.length > 0 && (
              <p className="text-xs text-right text-gray-500">
                Parça toplam: <strong>${partsTotal.toFixed(2)}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">İşçilik Ücreti ($)</label>
              <input type="number" step="0.01" min="0" className="input"
                value={laborCost} onChange={e => setLabor(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex items-end">
              <div className="bg-green-50 rounded-xl px-4 py-2.5 w-full border border-green-100">
                <p className="text-xs text-green-600">Toplam Tutar</p>
                <p className="text-xl font-bold text-green-700">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Not / Açıklama</label>
            <textarea className="input" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Yapılan işler, değiştirilen parçalar vb." />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" disabled={loading} className="btn-success flex-1 justify-center">
              {loading ? 'Kaydediliyor…' : '✓ İşi Tamamlandı Olarak Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Services page ─────────────────────────────────────
export default function Services() {
  const [jobs, setJobs]           = useState([])
  const [pagination, setPagination] = useState({})
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [completeJob, setCompleteJob] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getServices({ status: statusFilter, page })
      .then(r => { setJobs(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await api.updateService(id, { status })
    load()
  }

  const STATUS_OPTIONS = ['pending','in_progress','completed','paid','cancelled']
  const FILTER_TABS = [
    { value: '', label: 'Tümü' },
    { value: 'pending', label: 'Bekliyor' },
    { value: 'in_progress', label: 'Devam Ediyor' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'paid', label: 'Ödendi' },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Servis İşleri</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ Yeni İş Emri</button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {FILTER_TABS.map(t => (
          <button key={t.value} onClick={() => { setStatusFilter(t.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === t.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Yükleniyor…</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">İş emri bulunamadı</div>
        ) : jobs.map(job => (
          <div key={job.id} className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-gray-400">{job.job_number}</span>
                  <span className={`badge ${STATUS_BADGE[job.status]}`}>{STATUS_LABEL[job.status]}</span>
                  <span className="badge bg-gray-100 text-gray-500 text-xs capitalize">
                    {job.job_type?.replace(/_/g,' ')}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{job.created_at?.split(' ')[0]}</span>
                </div>

                {/* Customer */}
                <p className="font-semibold text-gray-900">{job.customer_name}</p>
                {job.customer_phone && (
                  <p className="text-xs text-gray-400">📞 {job.customer_phone}</p>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 mt-1">{job.description}</p>

                {/* Notes (shown after completion) */}
                {job.notes && (
                  <p className="text-xs text-gray-400 mt-1 italic">Not: {job.notes}</p>
                )}

                {/* Cost breakdown (shown after completion) */}
                {(Number(job.total_cost) > 0) && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>Parça: <strong>${Number(job.parts_cost).toFixed(2)}</strong></span>
                    <span>İşçilik: <strong>${Number(job.labor_cost).toFixed(2)}</strong></span>
                    <span className="font-semibold text-gray-800 text-sm">
                      Toplam: ${Number(job.total_cost).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right actions */}
              <div className="flex flex-col gap-2 items-end shrink-0">
                {/* Mark complete button — only for pending/in_progress */}
                {(job.status === 'pending' || job.status === 'in_progress') && (
                  <button onClick={() => setCompleteJob(job)}
                    className="btn-success text-xs px-3 py-1.5 whitespace-nowrap">
                    ✓ Tamamlandı
                  </button>
                )}

                {/* Status dropdown */}
                <select value={job.status}
                  onChange={e => updateStatus(job.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex justify-end gap-1">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">← Önceki</button>
          <span className="text-xs text-gray-400 px-2 py-1">{page}/{pagination.last_page}</span>
          <button disabled={page===pagination.last_page} onClick={() => setPage(p=>p+1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">Sonraki →</button>
        </div>
      )}

      {showNew && (
        <NewJobModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load() }} />
      )}
      {completeJob && (
        <CompleteModal job={completeJob} onClose={() => setCompleteJob(null)} onDone={() => { setCompleteJob(null); load() }} />
      )}
    </div>
  )
}
