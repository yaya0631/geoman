import { useRef, useState, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { useDossiers } from '@/hooks/useDossiers'
import { Dossier } from '@/types'
import { computeStatus, getRowColor, getStatusLabel, DEPOT_OPTIONS } from '@/lib/status'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant } from '@/lib/formatters'
import { ChevronUp, ChevronDown } from 'lucide-react'
import ContextMenu from './ContextMenu'

type ContextMenuState = { x: number; y: number; dossier: Dossier } | null

export default function DossierTable() {
  const {
    selectedIds, setSelectedIds, toggleSelected, clearSelection, lastSelectedId, setLastSelectedId,
    sortField, setSortField, sortDir, columns, filters, setModalOpen, setEditingDossierId, addRecent,
  } = useAppStore()
  const { filtered } = useFilters()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)

  const visibleColumns = columns.filter(c => c.visible)

  const handleRowClick = useCallback((e: React.MouseEvent, dossier: Dossier, idx: number) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelected(dossier.id)
      setLastSelectedId(dossier.id)
    } else if (e.shiftKey && lastSelectedId) {
      const lastIdx = filtered.findIndex(d => d.id === lastSelectedId)
      const min = Math.min(lastIdx, idx)
      const max = Math.max(lastIdx, idx)
      const newIds = new Set(selectedIds)
      filtered.slice(min, max + 1).forEach(d => newIds.add(d.id))
      setSelectedIds(newIds)
    } else {
      clearSelection()
      toggleSelected(dossier.id)
      setLastSelectedId(dossier.id)
      addRecent(dossier.id)
    }
  }, [filtered, lastSelectedId, selectedIds])

  const handleDoubleClick = useCallback((dossier: Dossier) => {
    setEditingDossierId(dossier.id)
    setModalOpen('edit-dossier')
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, dossier: Dossier) => {
    e.preventDefault()
    if (!selectedIds.has(dossier.id)) {
      clearSelection()
      toggleSelected(dossier.id)
    }
    setContextMenu({ x: e.clientX, y: e.clientY, dossier })
  }, [selectedIds])

  const renderCellContent = (col: typeof visibleColumns[0], dossier: Dossier, idx: number) => {
    const enc = getEncaisse(dossier)
    const reste = getReste(dossier)
    const status = computeStatus(dossier, enc)

    switch (col.key) {
      case 'row':
        return <span className="cell-row-num">{idx + 1}</span>
      case 'id':
        return <span className="cell-id">{dossier.id}</span>
      case 'nom':
        return <span className="cell-name">{dossier.nom}</span>
      case 'endroit':
        return <span style={{ color: 'var(--text-2)' }}>{dossier.endroit || '—'}</span>
      case 'date_finale':
        return <span className="cell-mono" style={{ fontSize: 11.5 }}>{formatDate(dossier.date_finale)}</span>
      case 'telephone':
        return <span className="cell-mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{dossier.telephone || '—'}</span>
      case 'montant':
        if (filters.showRemaining) {
          return <span className="cell-amount" style={{ color: reste > 0 ? 'var(--red)' : 'var(--green)' }}>{formatMontant(reste)}</span>
        }
        return (
          <span className="cell-amount">
            <span style={{ color: 'var(--green)', fontSize: 11 }}>{formatMontant(enc)}</span>
            <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>/</span>
            {formatMontant(dossier.montant)}
          </span>
        )
      case 'acte':
        return <span className="cell-bool">{dossier.acte ? '✓' : ''}</span>
      case 'regul':
        return <span className="cell-bool">{dossier.regul ? '✓' : ''}</span>
      case 'agricole':
        return <span className="cell-bool">{dossier.agricole ? '🌾' : ''}</span>
      case 'depot_cad':
        return renderDepot(dossier.depot_cad)
      case 'depot_domain':
        return renderDepot(dossier.depot_domain)
      case 'date_archive':
        return <span className="cell-mono" style={{ fontSize: 11.5 }}>{formatDate(dossier.date_archive)}</span>
      case 'etat':
        return renderStatus(status)
      case 'observations':
        return (
          <span style={{ color: 'var(--text-3)', fontSize: 11.5 }} title={dossier.observations || ''}>
            {dossier.observations ? dossier.observations.slice(0, 50) + (dossier.observations.length > 50 ? '…' : '') : ''}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="table-container" onClick={() => { if (contextMenu) setContextMenu(null) }}>
      <table className="dossier-table">
        <thead>
          <tr>
            {visibleColumns.map(col => {
              const isSorted = sortField === col.key
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={isSorted ? 'sorted' : ''}
                  onClick={() => col.key !== 'row' && setSortField(col.key as typeof sortField)}
                >
                  {col.label}
                  {isSorted && (
                    <span className="sort-indicator">
                      {sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                Aucun dossier trouvé
              </td>
            </tr>
          ) : (
            filtered.map((dossier, idx) => {
              const enc = getEncaisse(dossier)
              const status = computeStatus(dossier, enc)
              const rowClass = getRowColor(status)
              const isSelected = selectedIds.has(dossier.id)

              return (
                <tr
                  key={dossier.id}
                  className={`${rowClass} ${isSelected ? 'selected' : ''}`}
                  onClick={e => handleRowClick(e, dossier, idx)}
                  onDoubleClick={() => handleDoubleClick(dossier)}
                  onContextMenu={e => handleContextMenu(e, dossier)}
                >
                  {visibleColumns.map(col => (
                    <td key={col.key} style={{ width: col.width }}>
                      {renderCellContent(col, dossier, idx)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          dossier={contextMenu.dossier}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

function renderDepot(val?: string | null) {
  if (!val) return <span style={{ color: 'var(--text-dim)' }}>—</span>
  const cls = val === 'Depose' ? 'depot-depose' : val === 'Non depose' ? 'depot-non-depose' : 'depot-depose-2'
  return <span className={`depot-badge ${cls}`}>{val}</span>
}

function renderStatus(status: string) {
  const classMap: Record<string, string> = {
    'En retard': 'badge-overdue',
    'Echeance proche': 'badge-soon',
    'Solde partiel': 'badge-partial',
    'Termine': 'badge-done',
    'En attente': 'badge-waiting',
    'Bloque': 'badge-blocked',
    'Archive': 'badge-archived',
    'actif': 'badge-actif',
  }
  return <span className={`badge ${classMap[status] || 'badge-actif'}`}>{getStatusLabel(status as any)}</span>
}
