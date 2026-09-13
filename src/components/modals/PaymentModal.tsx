import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant } from '@/lib/formatters'
import { Plus, Trash2, Zap } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

export default function PaymentModal({ onClose }: Props) {
  const { editingDossierId, dossiers } = useAppStore()
  const { addPaiement, deletePaiement } = useDossiers()
  const dossier = dossiers.find(d => d.id === editingDossierId)

  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newMontant, setNewMontant] = useState('')
  const [newNote, setNewNote] = useState('')

  if (!dossier) return null

  const paiements = dossier.paiements || []
  const enc = getEncaisse(dossier)
  const reste = getReste(dossier)

  const handleAdd = async () => {
    const montant = parseFloat(newMontant)
    if (!montant || montant <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (montant > reste) {
      toast.error(`Le montant dépasse le reste à payer (${formatMontant(reste)})`)
      return
    }
    await addPaiement.mutateAsync({ dossierId: dossier.id, montant, date: newDate, note: newNote || undefined })
    setNewMontant('')
    setNewNote('')
  }

  const handleFull = () => {
    if (reste > 0) {
      setNewMontant(String(reste))
      toast('Montant du solde pré-rempli', { icon: '⚡' })
    }
  }

  return (
    <ModalShell
      title={<><span>Paiements — </span><span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span></>}
      onClose={onClose}
      size="md"
    >
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Montant total', value: formatMontant(dossier.montant), color: 'var(--text)' },
          { label: 'Encaissé', value: formatMontant(enc), color: 'var(--green)' },
          { label: 'Reste à payer', value: formatMontant(reste), color: reste > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Payments list */}
      <table className="payment-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Montant</th>
            <th>Note</th>
            <th style={{ width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {paiements.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 16 }}>
                Aucun paiement enregistré
              </td>
            </tr>
          ) : paiements.map(p => (
            <tr key={p.id}>
              <td className="text-mono" style={{ fontSize: 12 }}>{formatDate(p.date)}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--green)' }}>
                {formatMontant(p.montant)}
              </td>
              <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{p.note || '—'}</td>
              <td>
                <button
                  className="btn btn-icon btn-sm btn-danger"
                  onClick={() => deletePaiement.mutate(p.id)}
                  title="Supprimer"
                  aria-label="Supprimer le paiement"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add payment form */}
      <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-3)', borderRadius: 6, border: '1px solid var(--border)' }}>
        <div className="form-section-title" style={{ marginBottom: 10 }}>Ajouter un paiement</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-date">Date</label>
            <input id="pmt-date" className="form-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-amount">Montant (DA)</label>
            <input
              id="pmt-amount"
              className="form-input"
              type="number"
              placeholder="0"
              value={newMontant}
              onChange={e => setNewMontant(e.target.value)}
              min={0}
              inputMode="numeric"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-note">Note (optionnel)</label>
            <input id="pmt-note" className="form-input" placeholder="Remarque..." value={newNote} onChange={e => setNewNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn"
              onClick={handleFull}
              disabled={reste <= 0}
              title="Pré-remplir le montant du solde"
            >
              <Zap size={13} />
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!newMontant || addPaiement.isPending}
              style={{ height: 30 }}
            >
              <Plus size={13} /> Ajouter
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
