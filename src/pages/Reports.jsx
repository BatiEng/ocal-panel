import { useEffect, useState } from 'react'
import { api } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend,
} from 'recharts'

const fmt    = (n) => Number(n || 0).toFixed(2)
const fmtInt = (n) => Number(n || 0).toLocaleString()

const TABS = ['Günlük', 'Haftalık', 'Aylık']

// Custom stacked tooltip for the chart
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">
        {new Date(label).toLocaleDateString('tr-TR', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.fill || p.stroke }}>{p.name}</span>
          <span className="font-medium">${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1 pt-1 flex justify-between gap-4">
        <span className="text-gray-500">Toplam</span>
        <span className="font-bold text-gray-900">
          ${payload.reduce((s, p) => s + Number(p.value), 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}

const JOB_TYPE_LABEL = {
  pump_repair:      'Pompa Tamiri',
  copper_rewinding: 'Bakır Sargı',
  electrical:       'Elektrik İşi',
  other:            'Diğer',
}

export default function Reports() {
  const [tab, setTab]       = useState('Günlük')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const monday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - (d.getDay() || 7) + 1)
    return d.toISOString().split('T')[0]
  })()
  const [weekFrom, setWeekFrom] = useState(monday)
  const [year,  setYear]    = useState(new Date().getFullYear())
  const [month, setMonth]   = useState(new Date().getMonth() + 1)

  const load = () => {
    setLoading(true)
    let req
    if (tab === 'Günlük')   req = api.getDaily(date)
    if (tab === 'Haftalık') req = api.getWeekly(weekFrom)
    if (tab === 'Aylık')    req = api.getMonthly(year, month)
    req.then(({ data }) => setData(data.data))
       .catch(console.error)
       .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab, date, weekFrom, year, month])

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <h1 className="text-xl font-bold text-gray-900">Raporlar</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Period controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {tab === 'Günlük' && (
          <input type="date" className="input w-40" value={date} onChange={e => setDate(e.target.value)} />
        )}
        {tab === 'Haftalık' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Hafta başlangıcı</span>
            <input type="date" className="input w-40" value={weekFrom} onChange={e => setWeekFrom(e.target.value)} />
          </div>
        )}
        {tab === 'Aylık' && (
          <div className="flex items-center gap-2">
            <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('tr-TR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading
        ? <div className="text-center py-16 text-gray-400">Rapor yükleniyor…</div>
        : data && (
          <div className="space-y-5">

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-xs text-gray-500">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${fmt(data.total_revenue)}</p>
                <p className="text-xs text-gray-400 mt-1">Satış + Servis</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Ürün Satış Geliri</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">${fmt(data.sales_revenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{fmtInt(data.total_transactions)} işlem</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Servis Geliri</p>
                <p className="text-2xl font-bold text-green-600 mt-1">${fmt(data.service_revenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{fmtInt(data.service_jobs_count)} tamamlanan iş</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500">Satılan Ürün</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{fmtInt(data.total_items_sold)}</p>
                <p className="text-xs text-gray-400 mt-1">Ort. satış: ${fmt(data.avg_sale_value)}</p>
              </div>
            </div>

            {/* ── Revenue split bar ── */}
            {(Number(data.sales_revenue) > 0 || Number(data.service_revenue) > 0) && (
              <div className="card p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Gelir Dağılımı</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden flex">
                    {Number(data.total_revenue) > 0 && (
                      <>
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${(Number(data.sales_revenue) / Number(data.total_revenue)) * 100}%` }}
                          title={`Satış: $${fmt(data.sales_revenue)}`}
                        />
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${(Number(data.service_revenue) / Number(data.total_revenue)) * 100}%` }}
                          title={`Servis: $${fmt(data.service_revenue)}`}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                    Ürün Satışı — ${fmt(data.sales_revenue)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
                    Servis — ${fmt(data.service_revenue)}
                  </span>
                </div>
              </div>
            )}

            {/* ── Daily breakdown chart ── */}
            {data.daily_breakdown?.length > 0 && (
              <div className="card p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Günlük Gelir (Satış + Servis)</p>
                <ResponsiveContainer width="100%" height={220}>
                  {tab === 'Aylık' ? (
                    <LineChart data={data.daily_breakdown} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="sale_date" tick={{ fontSize: 10 }}
                        tickFormatter={d => new Date(d).getDate()} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="sales_revenue"   name="Satış"   stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="service_revenue" name="Servis"  stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={data.daily_breakdown} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="sale_date" tick={{ fontSize: 10 }}
                        tickFormatter={d => new Date(d).toLocaleDateString('tr-TR', { weekday: 'short' })} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="sales_revenue"   name="Satış"  stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
                      <Bar dataKey="service_revenue" name="Servis" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Top products */}
              {data.top_products?.length > 0 && (
                <div className="card p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">🏆 En Çok Satan Ürünler</p>
                  <div className="space-y-2">
                    {data.top_products.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category} · {fmtInt(p.total_qty)} adet</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">${fmt(p.total_revenue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales by category */}
              {data.by_category?.length > 0 && (
                <div className="card p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Kategoriye Göre Satışlar</p>
                  <div className="space-y-3">
                    {data.by_category.map(cat => {
                      const total = data.by_category.reduce((s, c) => s + Number(c.total_revenue), 0)
                      const pct   = total > 0 ? (Number(cat.total_revenue) / total) * 100 : 0
                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{cat.icon} {cat.category}</span>
                            <span className="font-medium">${fmt(cat.total_revenue)}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Service jobs in period ── */}
            {data.service_jobs?.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">🔧 Tamamlanan Servis İşleri</p>
                  <p className="text-sm font-bold text-green-600">
                    Toplam: ${fmt(data.service_jobs.reduce((s, j) => s + Number(j.total_cost), 0))}
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['İş No','Müşteri','İş Tipi','Parça','İşçilik','Toplam','Durum'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.service_jobs.map(j => (
                      <tr key={j.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{j.job_number}</td>
                        <td className="px-4 py-2 text-gray-700">{j.customer_name}</td>
                        <td className="px-4 py-2 text-xs text-gray-500 capitalize">
                          {JOB_TYPE_LABEL[j.job_type] || j.job_type}
                        </td>
                        <td className="px-4 py-2 text-gray-600">${fmt(j.parts_cost)}</td>
                        <td className="px-4 py-2 text-gray-600">${fmt(j.labor_cost)}</td>
                        <td className="px-4 py-2 font-bold text-gray-900">${fmt(j.total_cost)}</td>
                        <td className="px-4 py-2">
                          <span className={`badge text-xs ${
                            j.status === 'paid' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {j.status === 'paid' ? 'Ödendi' : 'Tamamlandı'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Daily sales list (daily tab only) ── */}
            {data.sales?.length > 0 && (
              <div className="card overflow-hidden">
                <p className="text-sm font-semibold text-gray-700 p-4 border-b border-gray-100">
                  🛒 Günün Satışları
                </p>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Satış No','Müşteri','Tutar','Ödeme','Saat'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.sales.map(s => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{s.sale_number}</td>
                        <td className="px-4 py-2 text-gray-700">{s.customer_name || '—'}</td>
                        <td className="px-4 py-2 font-semibold text-gray-900">${fmt(s.final_amount)}</td>
                        <td className="px-4 py-2 capitalize text-gray-500">{s.payment_method}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs">
                          {new Date(s.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )
      }
    </div>
  )
}
