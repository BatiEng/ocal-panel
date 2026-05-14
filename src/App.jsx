import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Inventory  from './pages/Inventory'
import Sales      from './pages/Sales'
import Reports    from './pages/Reports'
import Services   from './pages/Services'
import StockLog   from './pages/StockLog'
import Customers  from './pages/Customers'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                  element={<Dashboard />} />
            <Route path="inventory"       element={<Inventory />} />
            <Route path="sales"           element={<Sales />} />
            <Route path="reports"         element={<Reports />} />
            <Route path="services"        element={<Services />} />
            <Route path="stock-log"       element={<StockLog />} />
            <Route path="customers"       element={<Customers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
