import { useEffect, useState } from 'react'
import { api } from '../api/client'

const TYPE_BADGE = {
  in:         'bg-green-100 text-green-700',
  out:        'bg-red-100 text-red-700',
  adjustment: 'bg-blue-100 text-blue-700',
}
const TYPE_LABEL = { '': 'Tümü', in: 'Giriş', out: 'Çıkış', adjustment: 'Düzeltme' }

export default function StockLog() {
  const [movements, setMovements] = useState([])
  const [pagination, setPagination] = useState({})
  const [type, setType]   = useState('')
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getMovements({ type, from, to, page })
      .then(({ data }) => { setMovements(data.data); setPagination(data.pagination) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type, from, to, page])

  return (
    <div className="p-4 md:p-6 space-y-4 overflow-y-auto h-full">
      <h1 className="text-lg md:text-xl font-bold text-gray-900">Stok Logu</h1>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {['', 'in', 'out', 'adjustment'].map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1) }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <input type="date" className="input w-36" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
        <input type="date" className="input w-36" value={to}   onChange={e => { setTo(e.target.value); setPage(1) }} />
        {(from || to) && (
          <button onClick={() => { setFrom(''); setTo(''); setPage(1) }} className="btn-secondary text-xs">Temizle</button>
        )}
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tarih','Ürün','Tür','Miktar','Önceki → Sonraki','Açıklama','Kullanıcı'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">Yükleniyor…</td></tr>
                : movements.length === 0
                ? <tr><td colSpan="7" className="text-center py-12 text-gray-400">Hareket bulunamadı</td></tr>
                : movements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('tr-TR')}<br/>
                      <span className="text-gray-400">
                        {new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.product_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{m.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${TYPE_BADGE[m.type]}`}>{TYPE_LABEL[m.type] || m.type}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={m.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                        {m.type === 'in' ? '+' : '-'}{m.qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {m.qty_before} → <strong className="text-gray-900">{m.qty_after}</strong>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">
                      <p className="truncate">{m.reason}</p>
                      {m.reference_type && <span className="text-gray-400">via {m.reference_type}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.user_name || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {pagination.total} hareket · Sayfa {pagination.current_page} / {pagination.last_page}
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
    </div>
  )
}
