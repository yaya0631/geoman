import { useAppStore } from '@/store/appStore'
import { X } from 'lucide-react'

interface Props { onClose: () => void }

export default function ColumnsModal({ onClose }: Props) {
  const { columns, toggleColumn, setColumns } = useAppStore()

  const resetColumns = () => {
    setColumns(columns.map(c => ({ ...c, visible: true })))
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <span className="modal-title">Colonnes visibles</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {columns.map(col => (
              <label
                key={col.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 8px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  fontSize: 13,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumn(col.key)}
                  style={{ accentColor: 'var(--acc)' }}
                  disabled={col.key === 'row' || col.key === 'id'}
                />
                <span style={{ color: col.visible ? 'var(--text)' : 'var(--text-3)' }}>
                  {col.label}
                </span>
                {col.width && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {col.width}px
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={resetColumns}>Tout afficher</button>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
