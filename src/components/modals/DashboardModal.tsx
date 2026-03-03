import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { getEncaisse, getReste } from '@/lib/utils'
import { computeStatus } from '@/lib/status'
import { formatMontant } from '@/lib/formatters'
import { X, BarChart3 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend as RLegend,
} from 'recharts'

interface Props { onClose: () => void }

const COLORS = ['#1d8aff', '#22c55e', '#f43f5e', '#eab308', '#a855f7', '#f97316', '#14b8a6']

export default function DashboardModal({ onClose }: Props) {
  const { dossiers } = useAppStore()

  const stats = useMemo(() => {
    const actifs = dossiers.filter(d => !d.in_trash && !d.archived)
    const archives = dossiers.filter(d => d.archived && !d.in_trash)
    const corbeille = dossiers.filter(d => d.in_trash)

    const totalMontant = actifs.reduce((s, d) => s + d.montant, 0)
    const totalEncaisse = actifs.reduce((s, d) => s + getEncaisse(d), 0)
    const totalReste = actifs.reduce((s, d) => s + getReste(d), 0)

    const enRetard = actifs.filter(d => computeStatus(d, getEncaisse(d)) === 'En retard')
    const termines = actifs.filter(d => computeStatus(d, getEncaisse(d)) === 'Termine')

    // By location
    const byLocation: Record<string, number> = {}
    actifs.forEach(d => {
      if (d.endroit) byLocation[d.endroit] = (byLocation[d.endroit] || 0) + 1
    })
    const locationData = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))

    // By status
    const byStatus: Record<string, number> = {}
    actifs.forEach(d => {
      const s = computeStatus(d, getEncaisse(d))
      byStatus[s] = (byStatus[s] || 0) + 1
    })
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }))

    // By month (last 6 months)
    const monthMap: Record<string, number> = {}
    dossiers.forEach(d => {
      if (d.created_at) {
        const m = format(parseISO(d.created_at), 'MMM yy', { locale: fr })
        monthMap[m] = (monthMap[m] || 0) + 1
      }
    })
    const monthData = Object.entries(monthMap).slice(-6).map(([name, count]) => ({ name, count }))

    return {
      total: dossiers.length,
      actifs: actifs.length,
      archives: archives.length,
      corbeille: corbeille.length,
      enRetard: enRetard.length,
      termines: termines.length,
      totalMontant,
      totalEncaisse,
      totalReste,
      locationData,
      statusData,
      monthData,
    }
  }, [dossiers])

  const kpis = [
    { label: 'Total dossiers', value: stats.total, cls: 'blue' },
    { label: 'Actifs', value: stats.actifs, cls: '' },
    { label: 'Archives', value: stats.archives, cls: '' },
    { label: 'En retard', value: stats.enRetard, cls: 'red' },
    { label: 'Terminés', value: stats.termines, cls: 'green' },
    { label: 'Corbeille', value: stats.corbeille, cls: '' },
  ]

  const financials = [
    { label: 'Total attendu', value: formatMontant(stats.totalMontant), cls: 'blue' },
    { label: 'Total encaissé', value: formatMontant(stats.totalEncaisse), cls: 'green' },
    { label: 'Reste à payer', value: formatMontant(stats.totalReste), cls: stats.totalReste > 0 ? 'red' : 'green' },
  ]

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-full" style={{ maxHeight: '88vh' }}>
        <div className="modal-header">
          <BarChart3 size={16} style={{ color: 'var(--acc)' }} />
          <span className="modal-title">Tableau de bord analytique</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* KPI cards */}
          <div className="kpi-grid">
            {kpis.map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className={`kpi-value ${k.cls}`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Financial KPIs */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
            {financials.map(k => (
              <div key={k.label} className="kpi-card">
                <div className="kpi-label">{k.label}</div>
                <div className={`kpi-value ${k.cls}`} style={{ fontSize: 16 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* By location */}
            <div className="chart-card">
              <div className="chart-title">Dossiers par endroit</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.locationData} margin={{ top: 0, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text)' }}
                  />
                  <Bar dataKey="value" fill="var(--acc)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By status */}
            <div className="chart-card">
              <div className="chart-title">Répartition par état</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                    {stats.statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 6, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly trend */}
            <div className="chart-card" style={{ gridColumn: 'span 2' }}>
              <div className="chart-title">Nouveaux dossiers par mois</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={stats.monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 6, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--acc)" strokeWidth={2} dot={{ fill: 'var(--acc)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
