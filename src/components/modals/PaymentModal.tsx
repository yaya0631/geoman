import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant } from '@/lib/formatters'
import { Plus, Trash2, Zap, CreditCard, DollarSign, Calendar, CheckCircle2 } from 'lucide-react'
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
  const pctPaid = dossier.montant > 0 ? Math.min(100, Math.round((enc / dossier.montant) * 100)) : 0

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
    toast.success('Paiement enregistré avec succès')
  }

  const handleFull = () => {
    if (reste > 0) {
      setNewMontant(String(reste))
      toast('Montant du solde pré-rempli', { icon: '⚡' })
    }
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={18} style={{ color: 'var(--green)' }} />
          <span>Gestion des paiements — </span>
          <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span>
        </div>
      }
      onClose={onClose}
      size="md"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 4, fontWeight: 700 }}>
            Total attendu
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {formatMontant(dossier.montant)}
          </div>
        </div>

        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 4, fontWeight: 700 }}>
            Total perçu
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
            {formatMontant(enc)}
          </div>
        </div>

        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 4, fontWeight: 700 }}>
            Reste à recouvrer
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: reste > 0 ? 'var(--red)' : 'var(--green)' }}>
            {formatMontant(reste)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600 }}>
          <span>Progression du règlement</span>
          <span style={{ color: pctPaid === 100 ? 'var(--green)' : 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{pctPaid}%</span>
        </div>
        <div className="table-progress-bar" style={{ height: 6 }}>
          <div
            className="table-progress-fill"
            style={{
              width: `${pctPaid}%`,
              background: pctPaid === 100 ? 'var(--green)' : 'var(--acc-gradient)'
            }}
          />
        </div>
      </div>

      {/* Payments History Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16 }}>
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date du versement</th>
              <th>Montant versé</th>
              <th>Observations / Notes</th>
              <th style={{ width: 44, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paiements.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 12px' }}>
                  Aucun versement n'a encore été enregistré pour ce dossier.
                </td>
              </tr>
            ) : paiements.map(p => (
              <tr key={p.id}>
                <td className="text-mono" style={{ fontSize: 12 }}>{formatDate(p.date)}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                  {formatMontant(p.montant)}
                </td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.note || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-icon btn-sm btn-danger"
                    onClick={() => {
                      deletePaiement.mutate(p.id)
                      toast.success('Paiement supprimé')
                    }}
                    title="Supprimer ce paiement"
                    aria-label="Supprimer le paiement"
                    style={{ width: 24, height: 24 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add payment form */}
      <div className="form-section">
        <div className="form-section-title">
          <Plus size={14} />
          <span>Enregistrer un nouveau versement</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-date">Date</label>
            <input id="pmt-date" className="form-input text-mono" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-amount">Montant (DA) *</label>
            <input
              id="pmt-amount"
              className="form-input text-mono"
              type="number"
              placeholder="0"
              value={newMontant}
              onChange={e => setNewMontant(e.target.value)}
              min={0}
              inputMode="numeric"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pmt-note">Note / Référence</label>
            <input id="pmt-note" className="form-input" placeholder="ex. Espèces, chèque..." value={newNote} onChange={e => setNewNote(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleFull}
              disabled={reste <= 0}
              title="Pré-remplir le solde restant"
              style={{ padding: '0 8px', height: 32 }}
            >
              <Zap size={13} style={{ color: 'var(--yellow)' }} />
              <span>Solde</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={!newMontant || addPaiement.isPending}
              style={{ height: 32 }}
            >
              <Plus size={13} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
