import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import LoginPage from '@/pages/LoginPage'
import MainPage from '@/pages/MainPage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { LoadingState } from '@/components/ui/States'

// Charge recharts uniquement quand le dashboard est ouvert (~180 kB économisés sur le bundle initial)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))

function AppRoute() {
  const { theme } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <MainPage />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={
      <ProtectedRoute><AppRoute /></ProtectedRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Suspense fallback={<LoadingState label="Chargement du tableau de bord..." />}>
          <DashboardPage />
        </Suspense>
      </ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
