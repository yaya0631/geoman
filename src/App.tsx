import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import LoginPage from '@/pages/LoginPage'
import MainPage from '@/pages/MainPage'
import DashboardPage from '@/pages/DashboardPage'
import OfficePage from '@/pages/OfficePage'
import DossierModal from '@/components/modals/DossierModal'
import '@/office.css'

function OfficeRoute() {
  const { theme, modalOpen, editingDossierId, setModalOpen, setEditingDossierId } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const closeModal = () => {
    setModalOpen(null)
    setEditingDossierId(null)
  }

  return (
    <>
      <OfficePage />
      {(modalOpen === 'new-dossier' || modalOpen === 'edit-dossier') && (
        <DossierModal onClose={closeModal} editId={modalOpen === 'edit-dossier' ? editingDossierId : null} />
      )}
    </>
  )
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<OfficeRoute />} />
    <Route path="/legacy" element={<MainPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
