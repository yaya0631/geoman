import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import LoginPage from '@/pages/LoginPage'
import MainPage from '@/pages/MainPage'
import DashboardPage from '@/pages/DashboardPage'
import OfficePage from '@/pages/OfficePage'
import '@/office.css'

export default function App() {
  const { theme } = useAppStore()
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<OfficePage />} />
    <Route path="/legacy" element={<MainPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
