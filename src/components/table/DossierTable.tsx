import { useRef, useState, useCallback, ReactNode, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { useDossiers } from '@/hooks/useDossiers'
import { Dossier } from '@/types'
import { computeStatus, getRowColor, getStatusLabel, DEPOT_OPTIONS } from '@/lib/status'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant } from '@/lib/formatters'
import { ChevronUp, ChevronDown, Pencil, CreditCard, Folder, Plus, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import ContextMenu from './ContextMenu'

type ContextMenuState = { x: number; y: number; dossier: Dossier } | null

const PAGE_SIZES = [25, 50, 100, 250]

/**
 * Met en surbrillance la portion du texte qui correspond à la recherche active.
 * Utilisé dans les cellules texte du tableau pour un feedback visuel instantané.
 */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="mark-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function DossierTable() {
  const {
    selectedIds, setSelectedIds, toggleSelected, clearSelection, lastSelectedId, setLastSelectedId,
    sortField, setSortField, sortDir, columns, filters, setModalOpen, setEditingDossierId, addRecent,
  } = useAppStore()
  const { filtered } = useFilters()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const visibleColumns = columns.filter(c => c.visible)

  // Reset to page 1 when filters/sort change
  const filterKey = useMemo(
    () => `${filters.search}|${filters.endroit}|${filters.depotCad}|${filters.viewMode}|${filters.includeArchived}|${sortField}|${sortDir}`,
    [filters, sortField, sortDir]
  )
  useMemo(() => { setPage(1) }, [filterKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

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

  const getClientInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const renderCellContent = (col: typeof visibleColumns[0], dossier: Dossier, idx: number) => {
    const enc = getEncaisse(dossier)
    const reste = getReste(dossier)
    const status = computeStatus(dossier, enc)
    const pctPaid = dossier.montant > 0 ? Math.min(100, Math.round((enc / dossier.montant) * 100)) : 0

    switch (col.key) {
      case 'row':
        return <span className="cell-row-num">{idx + 1}</span>
      case 'id':
        return <span className="cell-id">{dossier.id}</span>
      case 'nom':
        return (
          <span className="cell-name">
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'var(--bg-3)',
                color: 'var(--text-2)',
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
                flexShrink: 0
              }}
            >
              {getClientInitials(dossier.nom)}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Highlight text={dossier.nom} query={filters.search} />
            </span>
          </span>
        )
      case 'endroit':
        return <span style={{ color: 'var(--text-2)', fontWeight: 500 }}><Highlight text={dossier.endroit || '—'} query={filters.search} /></span>
      case 'date_finale':
        return <span className="cell-mono" style={{ fontSize: 11.5 }}>{formatDate(dossier.date_finale)}</span>
      case 'telephone':
        return <span className="cell-mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}><Highlight text={dossier.telephone || '—'} query={filters.search} /></span>
      case 'montant':
        if (filters.showRemaining) {
          return (
            <div>
              <div className="cell-amount" style={{ color: reste > 0 ? 'var(--red)' : 'var(--green)' }}>
                {formatMontant(reste)}
              </div>
              <div className="table-progress-bar">
                <div className="table-progress-fill" style={{ width: `${pctPaid}%`, background: pctPaid === 100 ? 'var(--green)' : 'var(--acc)' }} />
              </div>
            </div>
          )
        }
        return (
          <div>
            <div className="cell-amount">
              <span style={{ color: 'var(--green)', fontSize: 11 }}>{formatMontant(enc)}</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>/</span>
              <span>{formatMontant(dossier.montant)}</span>
            </div>
            <div className="table-progress-bar">
              <div className="table-progress-fill" style={{ width: `${pctPaid}%`, background: pctPaid === 100 ? 'var(--green)' : 'var(--acc)' }} />
            </div>
          </div>
        )
      case 'acte':
        return <span className="cell-bool" style={{ color: dossier.acte ? 'var(--green)' : 'var(--text-dim)' }}>{dossier.acte ? '✓' : '—'}</span>
      case 'regul':
        return <span className="cell-bool" style={{ color: dossier.regul ? 'var(--acc)' : 'var(--text-dim)' }}>{dossier.regul ? '✓' : '—'}</span>
      case 'agricole':
        return <span className="cell-bool">{dossier.agricole ? '🌾' : '—'}</span>
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
            {dossier.observations ? (
              <Highlight text={dossier.observations.slice(0, 50) + (dossier.observations.length > 50 ? '…' : '')} query={filters.search} />
            ) : '—'}
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
                      {sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
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
              <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Inbox size={32} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Aucun dossier trouvé</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Ajustez vos filtres de recherche ou créez un nouveau dossier.</div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => { setEditingDossierId(null); setModalOpen('new-dossier') }}
                  >
                    <Plus size={12} /> Nouveau dossier
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            pagedRows.map((dossier, localIdx) => {
              const idx = (safePage - 1) * pageSize + localIdx
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

                  {/* Hover Quick Actions */}
                  <div className="row-quick-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-icon btn-sm btn-ghost"
                      title="Modifier (F2)"
                      onClick={() => {
                        setEditingDossierId(dossier.id)
                        setModalOpen('edit-dossier')
                      }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      className="btn btn-icon btn-sm btn-ghost"
                      title="Gérer les paiements"
                      onClick={() => {
                        setEditingDossierId(dossier.id)
                        setModalOpen('paiements')
                      }}
                    >
                      <CreditCard size={11} style={{ color: 'var(--green)' }} />
                    </button>
                    <button
                      className="btn btn-icon btn-sm btn-ghost"
                      title="Fichiers attachés"
                      onClick={() => {
                        setEditingDossierId(dossier.id)
                        setModalOpen('fichiers')
                      }}
                    >
                      <Folder size={11} style={{ color: 'var(--acc)' }} />
                    </button>
                  </div>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div className="table-pagination">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Lignes par page</span>
            <select
              className="filter-select"
              style={{ height: 28, fontSize: 11.5, padding: '0 24px 0 8px' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {filtered.length === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`} / {filtered.length}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                className="btn btn-icon btn-sm btn-ghost"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                title="Page précédente"
                aria-label="Page précédente"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', padding: '0 6px' }}>
                {safePage} / {totalPages}
              </span>
              <button
                className="btn btn-icon btn-sm btn-ghost"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                title="Page suivante"
                aria-label="Page suivante"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

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
