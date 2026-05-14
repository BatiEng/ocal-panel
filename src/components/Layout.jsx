import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/',          icon: '📊', label: 'Dashboard',  short: 'Ana'    },
  { to: '/inventory', icon: '📦', label: 'Stok',       short: 'Stok'   },
  { to: '/sales',     icon: '🛒', label: 'Satış',      short: 'Satış'  },
  { to: '/customers', icon: '👥', label: 'Müşteriler', short: 'Müş.'   },
  { to: '/services',  icon: '🔧', label: 'Servisler',  short: 'Servis' },
  { to: '/reports',   icon: '📈', label: 'Raporlar',   short: 'Rapor'  },
  { to: '/stock-log', icon: '📋', label: 'Stok Logu',  short: 'Log'    },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar (md+) ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">ÖCAL</p>
              <p className="text-xs text-gray-400">Stok ve Satış</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} title="Çıkış"
              className="text-gray-400 hover:text-red-500 transition-colors text-sm">⏻</button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex">
        {nav.map(({ to, icon, short }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}>
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[9px] font-medium leading-none">{short}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
