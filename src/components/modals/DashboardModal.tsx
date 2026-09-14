import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { getEncaisse, getReste } from '@/lib/utils'
import { computeStatus } from '@/lib/status'
import { formatMontant } from '@/lib/formatters'
import { BarChart3, Layers, CheckCircle2, Lock, AlertTriangle, MapPin, PieChart as PieIcon, Calendar, TrendingUp, Wallet, XCircle } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend as RLegend,
} from 'recharts'

interface Props { onClose: () => void }

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4']

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
    { label: 'Total dossiers', value: stats.total, color: 'var(--acc)', icon: Layers },
    { label: 'Dossiers actifs', value: stats.actifs, color: 'var(--text)', icon: CheckCircle2 },
    { label: 'Archivés', value: stats.archives, color: 'var(--text-3)', icon: Lock },
    { label: 'En retard', value: stats.enRetard, color: 'var(--red)', icon: AlertTriangle },
    { label: 'Terminés', value: stats.termines, color: 'var(--green)', icon: CheckCircle2 },
    { label: 'Corbeille', value: stats.corbeille, color: 'var(--orange)', icon: XCircle },
  ]

  const financials = [
    { label: 'Total attendu', value: formatMontant(stats.totalMontant), color: 'var(--acc)', icon: Wallet },
    { label: 'Total encaissé', value: formatMontant(stats.totalEncaisse), color: 'var(--green)', icon: TrendingUp },
    { label: 'Reste à percevoir', value: formatMontant(stats.totalReste), color: stats.totalReste > 0 ? 'var(--red)' : 'var(--green)', icon: AlertTriangle },
  ]

  const recouvrementRate = stats.totalMontant > 0
    ? Math.round((stats.totalEncaisse / stats.totalMontant) * 100)
    : 0

  const tooltipStyle = {
    contentStyle: { background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 12, boxShadow: 'var(--shadow)' },
    labelStyle: { color: 'var(--text)', fontWeight: 600 },
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} style={{ color: 'var(--acc)' }} />
          <span>Tableau de bord analytique foncier</span>
        </div>
      }
      onClose={onClose}
      size="full"
      footer={<button className="btn btn-primary" onClick={onClose}>Fermer</button>}
    >
      {/* Operational KPI cards */}
      <div className="kpi-grid">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="kpi-label">{k.label}</div>
                <Icon size={14} style={{ color: k.color, opacity: 0.8 }} />
              </div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {financials.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="kpi-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div className="kpi-label">{k.label}</div>
                <Icon size={14} style={{ color: k.color, opacity: 0.8 }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: k.color, marginTop: 4 }}>
                {k.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recovery rate progress */}
      <div className="chart-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="chart-title">
            <TrendingUp size={14} style={{ color: 'var(--green)' }} />
            <span>Taux de recouvrement global</span>
          </div>
          <span style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: recouvrementRate >= 80 ? 'var(--green)' : recouvrementRate >= 50 ? 'var(--yellow)' : 'var(--red)',
          }}>
            {recouvrementRate}%
          </span>
        </div>
        <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            width: `${recouvrementRate}%`,
            height: '100%',
            background: recouvrementRate >= 80 ? 'var(--green)' : recouvrementRate >= 50 ? 'var(--yellow)' : 'var(--red)',
            borderRadius: 5,
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* By location */}
        <div className="chart-card">
          <div className="chart-title">
            <MapPin size={14} style={{ color: 'var(--acc)' }} />
            <span>Dossiers par commune / endroit</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.locationData} margin={{ top: 0, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} angle={-25} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="value" fill="var(--acc)" radius={[4, 4, 0, 0]} name="Dossiers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By status */}
        <div className="chart-card">
          <div className="chart-title">
            <PieIcon size={14} style={{ color: 'var(--purple)' }} />
            <span>Répartition par état</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                {stats.statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-title">
            <Calendar size={14} style={{ color: 'var(--green)' }} />
            <span>Nouveaux dossiers par mois</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="var(--acc)" strokeWidth={2.5} dot={{ fill: 'var(--acc)', r: 4 }} activeDot={{ r: 6 }} name="Dossiers créés" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ModalShell>
  )
}
