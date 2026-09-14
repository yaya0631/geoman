import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Dossier } from '@/types'
import { DEPOT_OPTIONS, STATUS_OPTIONS } from '@/lib/status'
import { generateDossierId } from '@/lib/formatters'
import ModalShell from '@/components/ui/ModalShell'
import { FileEdit, Plus, User, MapPin, Phone, Calendar, DollarSign, Building, CheckSquare, Sparkles } from 'lucide-react'

const schema = z.object({
  id: z.string().min(1, 'N° de dossier requis'),
  nom: z.string().min(1, 'Nom du client requis'),
  endroit: z.string().optional(),
  telephone: z.string().optional(),
  date_finale: z.string().optional(),
  montant: z.coerce.number().min(0, 'Le montant ne peut pas être négatif'),
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
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
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEdit ? <FileEdit size={18} style={{ color: 'var(--acc)' }} /> : <Plus size={18} style={{ color: 'var(--green)' }} />}
          <span>{isEdit ? `Modification du dossier — ${editId}` : 'Nouveau dossier foncier'}</span>
        </div>
      }
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending} form="dossier-form">
            {isPending ? 'Enregistrement en cours...' : isEdit ? 'Enregistrer modifications' : 'Créer le dossier'}
          </button>
        </>
      }
    >
      <form id="dossier-form" onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Identification Section */}
          <div className="form-section">
            <div className="form-section-title">
              <User size={14} />
              <span>Identification du client & dossier</span>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-field">
                <label className="form-label">N° Dossier *</label>
                <input
                  className={`form-input text-mono ${errors.id ? 'input-invalid' : ''}`}
                  {...register('id')}
                  readOnly={isEdit}
                  style={isEdit ? { opacity: 0.7, background: 'var(--bg-3)' } : {}}
                />
                {errors.id && <span className="form-error">{errors.id.message}</span>}
              </div>
              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Nom complet du client *</label>
                <input className={`form-input ${errors.nom ? 'input-invalid' : ''}`} {...register('nom')} placeholder="ex. Karim BENALI" />
                {errors.nom && <span className="form-error">{errors.nom.message}</span>}
              </div>
            </div>

            <div className="form-grid form-grid-2" style={{ marginTop: 12 }}>
              <div className="form-field">
                <label className="form-label">Localité / Commune / Lieudit</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" {...register('endroit')} placeholder="ex. Alger Centre, Bab El Oued..." />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Numéro de téléphone</label>
                <input className="form-input text-mono" {...register('telephone')} placeholder="05xx xx xx xx" />
              </div>
            </div>
          </div>

          {/* Financial & Deadline Section */}
          <div className="form-section">
            <div className="form-section-title">
              <DollarSign size={14} />
              <span>Finances & Échéances</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">Montant total des honoraires (DA)</label>
                <input className={`form-input text-mono ${errors.montant ? 'input-invalid' : ''}`} type="number" {...register('montant')} min={0} placeholder="0" />
                {errors.montant && <span className="form-error">{errors.montant.message}</span>}
              </div>
              <div className="form-field">
                <label className="form-label">Date limite / Échéance finale</label>
                <input className="form-input text-mono" type="date" {...register('date_finale')} />
              </div>
            </div>
          </div>

          {/* Dépôts cadastraux */}
          <div className="form-section">
            <div className="form-section-title">
              <Building size={14} />
              <span>Dépôts cadastre & domaine</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">Dépôt Cadastre (CAD)</label>
                <select className="form-select" {...register('depot_cad')}>
                  {DEPOT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt || '— Non déposé / Non défini —'}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Dépôt Domaine</label>
                <select className="form-select" {...register('depot_domain')}>
                  {DEPOT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt || '— Non déposé / Non défini —'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status & Options */}
          <div className="form-section">
            <div className="form-section-title">
              <CheckSquare size={14} />
              <span>État & Caractéristiques</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-field">
                <label className="form-label">État d'avancement</label>
                <select className="form-select" {...register('etat')}>
                  {STATUS_OPTIONS.filter(s => s !== 'Archive').map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Indicateurs fonciers</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('acte')} />
                    <span>Acte établi</span>
                  </label>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('regul')} />
                    <span>Régularisation</span>
                  </label>
                  <label className="form-checkbox-row">
                    <input type="checkbox" {...register('agricole')} />
                    <span>Agricole 🌾</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="form-section">
            <div className="form-section-title">
              <FileEdit size={14} />
              <span>Notes et observations internes</span>
            </div>
            <textarea
              className="form-textarea"
              {...register('observations')}
              rows={3}
              placeholder="Instructions géomètre, références cadastrales, remarques particulières..."
            />
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
