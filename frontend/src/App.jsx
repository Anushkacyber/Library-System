import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BooksPage from './pages/Books'
import SeatsPage from './pages/Seats'
import BorrowHistory from './pages/BorrowHistory'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBooks from './pages/admin/AdminBooks'
import AdminStudents from './pages/admin/AdminStudents'
import AdminSeats from './pages/admin/AdminSeats'
import AdminBorrows from './pages/admin/AdminBorrows'
import AdminFines from './pages/admin/AdminFines'
import Layout from './components/common/Layout'
import AdminLayout from './components/common/AdminLayout'
import LoadingScreen from './components/common/LoadingScreen'

const Protected = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/seats" element={<SeatsPage />} />
        <Route path="/history" element={<BorrowHistory />} />
      </Route>
      <Route element={<Protected adminOnly><AdminLayout /></Protected>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/books" element={<AdminBooks />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/borrows" element={<AdminBorrows />} />
        <Route path="/admin/seats" element={<AdminSeats />} />
        <Route path="/admin/fines" element={<AdminFines />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
