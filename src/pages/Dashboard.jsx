import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function fmt(n) { return Number(n || 0).toFixed(2) }
function fmtInt(n) { return Number(n || 0).toLocaleString() }

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [weekly,  setWeekly]  = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getSummary(), api.getWeekly()])
      .then(([s, w]) => {
        setSummary(s.data.data)
        setWeekly(w.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400 text-sm">Yükleniyor…</div>
    </div>
  )

  const t   = summary?.today    || {}
  const m   = summary?.month    || {}
  const stock = summary?.stock    || {}
  const svc   = summary?.services || {}

  return (
    <div className="p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ana Sayfa</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/sales')} className="btn-primary">
          + Yeni Satış
        </button>
      </div>

      {/* Bugün KPI */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bugün</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="💰" label="Toplam Ciro"      value={`₺${fmt(t.total_revenue)}`}      color="green" />
          <StatCard icon="🛒" label="Satış Sayısı"     value={fmtInt(t.total_transactions)}     color="blue" />
          <StatCard icon="📦" label="Satılan Ürün"     value={fmtInt(t.total_items_sold)}       color="purple" />
          <StatCard icon="🏷️" label="Ortalama Satış"  value={`₺${fmt(t.avg_sale_value)}`}      color="amber" />
        </div>
      </div>

      {/* Bu ay + Stok + Servisler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">📅 Bu Ay</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Ciro</span><span className="font-semibold text-gray-900">₺{fmt(m.total_revenue)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Satış Sayısı</span><span className="font-semibold text-gray-900">{fmtInt(m.total_transactions)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Satılan Ürün</span><span className="font-semibold text-gray-900">{fmtInt(m.total_items_sold)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">İndirimler</span><span className="font-semibold text-red-500">-₺{fmt(m.total_discounts)}</span></div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">📦 Stok Durumu</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Toplam Ürün</span><span className="font-semibold text-gray-900">{fmtInt(stock.total_products)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Stok Değeri</span><span className="font-semibold text-gray-900">₺{fmt(stock.inventory_value)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Kritik Stok</span>
              {Number(stock.low_stock_count) > 0
                ? <span className="badge bg-red-100 text-red-700">⚠ {stock.low_stock_count} ürün</span>
                : <span className="badge bg-green-100 text-green-700">✓ Normal</span>
              }
            </div>
          </div>
          {Number(stock.low_stock_count) > 0 && (
            <button onClick={() => navigate('/inventory?low_stock=1')}
              className="mt-3 text-xs text-red-600 hover:underline">Kritik stokları gör →</button>
          )}
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">🔧 Servis İşleri</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Toplam İş</span><span className="font-semibold text-gray-900">{fmtInt(svc.total_jobs)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bekleyen</span><span className="badge bg-amber-100 text-amber-700">{svc.pending}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Devam Eden</span><span className="badge bg-blue-100 text-blue-700">{svc.in_progress}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Servis Geliri</span><span className="font-semibold text-green-600">₺{fmt(svc.paid_revenue)}</span></div>
          </div>
        </div>
      </div>

      {/* Haftalık grafik */}
      {weekly?.daily_breakdown?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">📈 Bu Hafta — Günlük Ciro</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly.daily_breakdown} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sale_date" tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('tr-TR', { weekday: 'short' })} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [`₺${Number(v).toFixed(2)}`, 'Ciro']}
                labelFormatter={(d) => new Date(d).toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Kategoriye göre satış */}
      {weekly?.by_category?.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Bu Hafta Kategoriye Göre Satış</p>
          <div className="space-y-2">
            {weekly.by_category.map((cat) => {
              const total = weekly.by_category.reduce((s, c) => s + Number(c.total_revenue), 0)
              const pct   = total > 0 ? (Number(cat.total_revenue) / total) * 100 : 0
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cat.icon} {cat.category}</span>
                    <span className="font-medium">₺{fmt(cat.total_revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
