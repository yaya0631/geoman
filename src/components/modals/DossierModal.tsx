import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Dossier } from '@/types'
import { DEPOT_OPTIONS, STATUS_OPTIONS } from '@/lib/status'
import { generateDossierId } from '@/lib/formatters'
import { X } from 'lucide-react'

const schema = z.object({
  id: z.string().min(1, 'Requis'),
  nom: z.string().min(1, 'Nom requis'),
  endroit: z.string().optional(),
  telephone: z.string().optional(),
  date_finale: z.string().optional(),
  montant: z.coerce.number().min(0),
  acte: z.boolean(),
  regul: z.boolean(),
  agricole: z.boolean(),
  depot_cad: z.string(),
  depot_domain: z.string(),
  etat: z.string(),
  observations: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  editId?: string | null
}

export default function DossierModal({ onClose, editId }: Props) {
  const { dossiers } = useAppStore()
  const { createDossier, updateDossierMutation } = useDossiers()
  const isEdit = !!editId
  const existing = editId ? dossiers.find(d => d.id === editId) : null

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: isEdit && existing ? existing.id : generateDossierId(dossiers.map(d => d.id)),
      nom: existing?.nom || '',
      endroit: existing?.endroit || '',
      telephone: existing?.telephone || '',
      date_finale: existing?.date_finale || '',
      montant: existing?.montant || 0,
      acte: existing?.acte || false,
      regul: existing?.regul || false,
      agricole: existing?.agricole || false,
      depot_cad: existing?.depot_cad || '',
      depot_domain: existing?.depot_domain || '',
      etat: existing?.etat || 'actif',
      observations: existing?.observations || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (isEdit && editId) {
      await updateDossierMutation.mutateAsync({ id: editId, updates: data as Partial<Dossier> })
    } else {
      await createDossier.mutateAsync({
        ...data,
        archived: false,
        in_trash: false,
        date_archive: undefined,
      } as Omit<Dossier, 'created_at' | 'updated_at' | 'paiements' | 'fichiers' | 'historique'>)
    }
    onClose()
  }

  const isPending = createDossier.isPending || updateDossierMutation.isPending

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="modal modal-lg" onSubmit={handleSubmit(onSubmit)}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? `Modifier — ${editId}` : 'Nouveau dossier'}</span>
          <button type="button" className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Identification */}
          <div className="form-section">
            <div className="form-section-title">Identification</div>
            <div className="form-grid form-grid-3">
              <div className="form-field">
                <label className="form-label">N° Dossier *</label>
                <input className="form-input" {...register('id')} readOnly={isEdit} style={isEdit ? { opacity: 0.6 } : {}} />
                {errors.id && <span className="form-error">{errors.id.message}</span>}
              </div>
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Nom du client *</label>
                <input className="form-input" {...register('nom')} placeholder="Prénom NOM" />
                {errors.nom && <span className="form-error">{errors.nom.message}</span>}
              </div>
            </div>
            <div className="form-grid form-grid-2" style={{ marginTop: 10 }}>
              <div className="form-field">
                <label className="form-label">Endroit / Localité</label>
                <input className="form-input" {...register('endroit')} placeholder="Commune, commune..." />
              </div>
              <div className="form-field">
                <label className="form-label">Téléphone</label>
                <input className="form-input" {...register('telephone')} placeholder="05xx xx xx xx" />
              </div>
            </div>
          </div>

          {/* Financial & Deadline */}
          <div className="form-section" style={{ marginTop: 10 }}>
            <div className="form-section-title">Financier & Échéances</div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">Montant total (DA)</label>
                <input className="form-input" type="number" {...register('montant')} min={0} />
              </div>
              <div className="form-field">
                <label className="form-label">Date d'échéance</label>
                <input className="form-input" type="date" {...register('date_finale')} />
              </div>
            </div>
          </div>

          {/* Dépôts */}
          <div className="form-section" style={{ marginTop: 10 }}>
            <div className="form-section-title">Dépôts cadastraux</div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">Dépôt CAD</label>
                <select className="form-select" {...register('depot_cad')}>
                  {DEPOT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt || '— Non défini —'}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Dépôt Domaine</label>
                <select className="form-select" {...register('depot_domain')}>
                  {DEPOT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt || '— Non défini —'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status & flags */}
          <div className="form-section" style={{ marginTop: 10 }}>
            <div className="form-section-title">État & Indicateurs</div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">État du dossier</label>
                <select className="form-select" {...register('etat')}>
                  {STATUS_OPTIONS.filter(s => s !== 'Archive').map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('acte')} />
                    Acte établi
                  </label>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('regul')} />
                    Régularisation
                  </label>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('agricole')} />
                    Terrain agricole 🌾
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="form-section" style={{ marginTop: 10 }}>
            <div className="form-section-title">Observations</div>
            <textarea className="form-textarea" {...register('observations')} rows={3} placeholder="Notes, remarques..." />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </div>
  )
}
