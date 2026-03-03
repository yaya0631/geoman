import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { computeStatus } from '@/lib/status'
import { getEncaisse } from '@/lib/utils'

// Layout
import Navbar from '@/components/layout/Navbar'
import CommandBar from '@/components/layout/CommandBar'
import FilterBar from '@/components/layout/FilterBar'
import StatusBar from '@/components/layout/StatusBar'
import Legend from '@/components/layout/Legend'

// Table & Sidebar
import DossierTable from '@/components/table/DossierTable'
import DetailSidebar from '@/components/sidebar/DetailSidebar'

// Modals
import DossierModal from '@/components/modals/DossierModal'
import PaymentModal from '@/components/modals/PaymentModal'
import FilesModal from '@/components/modals/FilesModal'
import HistoryModal from '@/components/modals/HistoryModal'
import DashboardModal from '@/components/modals/DashboardModal'
import RemindersModal from '@/components/modals/RemindersModal'
import ExportModal from '@/components/modals/ExportModal'
import ColumnsModal from '@/components/modals/ColumnsModal'
import SettingsModal from '@/components/modals/SettingsModal'
import CommandPalette from '@/components/modals/CommandPalette'
import ConfirmModal from '@/components/modals/ConfirmModal'
import BulkActionsBar from '@/components/ui/BulkActionsBar'

export default function MainPage() {
  const { modalOpen, setModalOpen, setEditingDossierId, editingDossierId, settings, dossiers } = useAppStore()
  const { query } = useDossiers()

  // Initialize hooks
  useKeyboard()
  useRealtimeSync()

  // Show reminders on startup if there are overdue dossiers
  useEffect(() => {
    if (!settings.showRemindersOnStart) return
    if (query.isSuccess && dossiers.length > 0) {
      const hasOverdue = dossiers.some(d => {
        if (d.in_trash || d.archived) return false
        return computeStatus(d, getEncaisse(d)) === 'En retard'
      })
      if (hasOverdue) {
        setTimeout(() => setModalOpen('reminders'), 800)
      }
    }
  }, [query.isSuccess])

  const closeModal = () => {
    setModalOpen(null)
    setEditingDossierId(null)
  }

  return (
    <div className="app-root">
      <Navbar />
      <CommandBar />
      <FilterBar />

      <div className="main-content">
        {query.isLoading ? (
          <div className="loading-overlay" style={{ position: 'relative', flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement des dossiers...</div>
            </div>
          </div>
        ) : (
          <DossierTable />
        )}
        <DetailSidebar />
      </div>

      <StatusBar />
      <Legend />

      {/* Bulk actions floating bar */}
      <BulkActionsBar />

      {/* Modals */}
      {modalOpen === 'new-dossier' && (
        <DossierModal onClose={closeModal} editId={null} />
      )}
      {modalOpen === 'edit-dossier' && editingDossierId && (
        <DossierModal onClose={closeModal} editId={editingDossierId} />
      )}
      {modalOpen === 'paiements' && editingDossierId && (
        <PaymentModal onClose={closeModal} />
      )}
      {modalOpen === 'fichiers' && editingDossierId && (
        <FilesModal onClose={closeModal} />
      )}
      {modalOpen === 'historique' && editingDossierId && (
        <HistoryModal onClose={closeModal} />
      )}
      {modalOpen === 'dashboard' && (
        <DashboardModal onClose={closeModal} />
      )}
      {modalOpen === 'reminders' && (
        <RemindersModal onClose={closeModal} />
      )}
      {modalOpen === 'export' && (
        <ExportModal onClose={closeModal} />
      )}
      {modalOpen === 'columns' && (
        <ColumnsModal onClose={closeModal} />
      )}
      {modalOpen === 'settings' && (
        <SettingsModal onClose={closeModal} />
      )}
      {modalOpen === 'command-palette' && (
        <CommandPalette onClose={closeModal} />
      )}
    </div>
  )
}
