import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

function CustomerModal({ customer, onClose, onDone }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    name:    customer?.name    || '',
    phone:   customer?.phone   || '',
    email:   customer?.email   || '',
    address: customer?.address || '',
    notes:   customer?.notes   || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Ad gerekli'); return }
    setError('')
    setLoading(true)
    try {
      if (isEdit) await api.updateCustomer(customer.id, form)
      else        await api.createCustomer(form)
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h3>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Ad Soyad *</label>
            <input className="input" value={form.name} onChange={e => setF('name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telefon</label>
              <input className="input" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="05xx..." />
            </div>
            <div>
              <label className="label">E-posta</label>
              <input type="email" className="input" value={form.email} onChange={e => setF('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Adres</label>
            <input className="input" value={form.address} onChange={e => setF('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Not</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Müşteri Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CustomerDetail({ customerId, onEdit, onDelete, onBack }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('sales')

  const load = useCallback(() => {
    if (!customerId) return
    setLoading(true)
    api.getCustomer(customerId)
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }, [customerId])

  useEffect(() => { load() }, [load])

  if (!customerId) return (
    <div className="hidden md:flex flex-1 items-center justify-center text-gray-300 text-sm">
      ← Müşteri seçin
    </div>
  )

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Yükleniyor…</div>
  )

  if (!data) return null

  const totalSpent = (parseFloat(data.total_sales_amount)||0) + (parseFloat(data.total_service_amount)||0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile back button */}
      {onBack && (
        <button onClick={onBack}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 text-sm text-blue-600 font-medium">
          ← Müşteri Listesi
        </button>
      )}

      {/* Customer header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{data.name}</h2>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap text-sm text-gray-500">
              {data.phone && <span>📞 {data.phone}</span>}
              {data.email && <span>✉ {data.email}</span>}
              {data.address && <span>📍 {data.address}</span>}
            </div>
            {data.notes && <p className="text-xs text-gray-400 mt-1 italic">{data.notes}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEdit(data)} className="btn-secondary text-xs px-3 py-1.5">Düzenle</button>
            <button onClick={() => onDelete(data)} className="text-xs px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-gray-200 transition-colors">Sil</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-green-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-green-600">Satışlardan</p>
            <p className="text-sm font-bold text-green-700">₺{parseFloat(data.total_sales_amount||0).toFixed(0)}</p>
            <p className="text-xs text-green-500">{data.sales?.length || 0} işlem</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-blue-600">Servislerden</p>
            <p className="text-sm font-bold text-blue-700">₺{parseFloat(data.total_service_amount||0).toFixed(0)}</p>
            <p className="text-xs text-blue-500">{data.service_jobs?.length || 0} iş</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-purple-600">Toplam</p>
            <p className="text-sm font-bold text-purple-700">₺{totalSpent.toFixed(0)}</p>
            <p className="text-xs text-purple-500">tüm zamanlar</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50">
        {[
          { key: 'sales',    label: `Satışlar (${data.sales?.length || 0})` },
          { key: 'services', label: `Servisler (${data.service_jobs?.length || 0})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'sales' && (
          data.sales?.length === 0
            ? <p className="text-center text-gray-400 py-8 text-sm">Henüz satış yok</p>
            : data.sales?.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono">{s.sale_number}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sale_date}</p>
                    {s.products && (
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{s.products}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₺{Number(s.final_amount).toFixed(2)}</p>
                    <span className="text-xs text-gray-400 capitalize">{s.payment_method}</span>
                  </div>
                </div>
              </div>
            ))
        )}

        {tab === 'services' && (
          data.service_jobs?.length === 0
            ? <p className="text-center text-gray-400 py-8 text-sm">Henüz servis yok</p>
            : data.service_jobs?.map(j => (
              <div key={j.id} className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-mono text-gray-400">{j.job_number}</p>
                      <span className={`badge text-xs ${
                        j.status === 'paid' ? 'bg-purple-100 text-purple-700' :
                        j.status === 'completed' ? 'bg-green-100 text-green-700' :
                        j.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{j.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5 truncate">{j.description}</p>
                    <p className="text-xs text-gray-400">{j.created_at?.split(' ')[0]}</p>
                  </div>
                  <p className="font-bold text-gray-900 shrink-0">₺{Number(j.total_cost).toFixed(2)}</p>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers]   = useState([])
  const [pagination, setPagination] = useState({})
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)
  const [modal, setModal]           = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getCustomers({ search, page })
      .then(r => { setCustomers(r.data.data); setPagination(r.data.pagination) })
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (customer) => {
    if (!confirm(`"${customer.name}" silinsin mi?`)) return
    await api.deleteCustomer(customer.id)
    if (selected === customer.id) setSelected(null)
    load()
  }

  // Customer list panel
  const ListPanel = (
    <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-72 shrink-0 flex-col border-r border-gray-100 bg-white overflow-hidden`}>
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Müşteriler</h1>
          <button onClick={() => setModal({})} className="btn-primary text-xs px-3 py-1.5">+ Ekle</button>
        </div>
        <input placeholder="Müşteri ara…" className="input text-sm"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {loading
          ? <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor…</div>
          : customers.length === 0
          ? <div className="text-center py-8 text-gray-400 text-sm">Müşteri bulunamadı</div>
          : customers.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                selected === c.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-gray-700">
                    ₺{(parseFloat(c.total_spent_sales||0)+parseFloat(c.total_spent_services||0)).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400">{c.total_sales} satış</p>
                </div>
              </div>
            </button>
          ))
        }
      </div>

      {pagination.last_page > 1 && (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}
            className="btn-secondary px-2 py-1 text-xs disabled:opacity-40">←</button>
          <span className="text-xs text-gray-400">{page}/{pagination.last_page}</span>
          <button disabled={page===pagination.last_page} onClick={() => setPage(p=>p+1)}
            className="btn-secondary px-2 py-1 text-xs disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-full overflow-hidden">
      {ListPanel}

      {/* Detail panel */}
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 overflow-hidden bg-gray-50`}>
        <CustomerDetail
          customerId={selected}
          onBack={() => setSelected(null)}
          onEdit={(c) => setModal(c)}
          onDelete={handleDelete}
        />
      </div>

      {modal !== null && (
        <CustomerModal
          customer={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null)
            load()
            if (modal?.id && modal.id === selected) setSelected(null)
          }}
        />
      )}
    </div>
  )
}
