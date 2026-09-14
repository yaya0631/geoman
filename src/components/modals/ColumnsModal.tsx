import { useAppStore } from '@/store/appStore'
import { Columns, Check, Eye } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'

interface Props { onClose: () => void }

export default function ColumnsModal({ onClose }: Props) {
  const { columns, toggleColumn, setColumns } = useAppStore()

  const resetColumns = () => {
    setColumns(columns.map(c => ({ ...c, visible: true })))
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Columns size={18} style={{ color: 'var(--acc)' }} />
          <span>Personnalisation des colonnes</span>
        </div>
      }
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={resetColumns}>Rétablir tout</button>
          <button className="btn btn-primary" onClick={onClose}>Appliquer</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {columns.map(col => (
          <label
            key={col.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: col.key === 'row' || col.key === 'id' ? 'not-allowed' : 'pointer',
              background: col.visible ? 'var(--bg-2)' : 'transparent',
              border: '1px solid',
              borderColor: col.visible ? 'var(--border)' : 'transparent',
              transition: 'all 0.12s',
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => toggleColumn(col.key)}
              style={{ accentColor: 'var(--acc)', width: 15, height: 15 }}
              disabled={col.key === 'row' || col.key === 'id'}
            />
            <span style={{ fontWeight: col.visible ? 600 : 400, color: col.visible ? 'var(--text)' : 'var(--text-3)' }}>
              {col.label}
            </span>
            {col.width && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                {col.width} px
              </span>
            )}
          </label>
        ))}
      </div>
    </ModalShell>
  )
}
