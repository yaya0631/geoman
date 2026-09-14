import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useMemo } from 'react'
import { getEncaisse, getReste } from '@/lib/utils'
import { computeStatus } from '@/lib/status'
import { formatMontant } from '@/lib/formatters'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ArrowLeft, RefreshCw, Layers, CheckCircle2, AlertTriangle, Lock,
  TrendingUp, DollarSign, MapPin, PieChart as PieIcon, BarChart2, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4']

export default function DashboardPage() {
  const navigate = useNavigate()
  const { dossiers } = useAppStore()
  const { query } = useDossiers()
  useRealtimeSync()

  const stats = useMemo(() => {
    const actifs = dossiers.filter(d => !d.in_trash && !d.archived)
    const archives = dossiers.filter(d => d.archived && !d.in_trash)

    const totalMontant = actifs.reduce((s, d) => s + d.montant, 0)
    const totalEncaisse = actifs.reduce((s, d) => s + getEncaisse(d), 0)
    const totalReste = actifs.reduce((s, d) => s + getReste(d), 0)

    const enRetard = actifs.filter(d => computeStatus(d, getEncaisse(d)) === 'En retard').length
    const termines = actifs.filter(d => computeStatus(d, getEncaisse(d)) === 'Termine').length
    const bloques = actifs.filter(d => computeStatus(d, getEncaisse(d)) === 'Bloque').length

    const byLocation: Record<string, number> = {}
    actifs.forEach(d => { if (d.endroit) byLocation[d.endroit] = (byLocation[d.endroit] || 0) + 1 })
    const locationData = Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }))

    const byStatus: Record<string, number> = {}
    actifs.forEach(d => {
      const s = computeStatus(d, getEncaisse(d))
      byStatus[s] = (byStatus[s] || 0) + 1
    })
    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }))

    const monthMap: Record<string, number> = {}
    dossiers.forEach(d => {
      if (d.created_at) {
        const m = format(parseISO(d.created_at), 'MMM yy', { locale: fr })
        monthMap[m] = (monthMap[m] || 0) + 1
      }
    })
    const monthData = Object.entries(monthMap).slice(-12).map(([name, count]) => ({ name, count }))

    const recentOverdue = actifs
      .filter(d => computeStatus(d, getEncaisse(d)) === 'En retard')
      .slice(0, 10)

    return {
      total: dossiers.length,
      actifs: actifs.length,
      archives: archives.length,
      enRetard,
      termines,
      bloques,
      totalMontant,
      totalEncaisse,
      totalReste,
      tauxRecouvrement: totalMontant > 0 ? Math.round((totalEncaisse / totalMontant) * 100) : 0,
      locationData,
      statusData,
      monthData,
      recentOverdue,
    }
  }, [dossiers])

  const tooltipStyle = {
    contentStyle: { background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 12, boxShadow: 'var(--shadow)' },
    labelStyle: { color: 'var(--text)', fontWeight: 600 },
  }

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> <span>Retour aux dossiers</span>
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>Tableau de bord de pilotage</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => query.refetch()} title="Actualiser les statistiques">
          <RefreshCw size={14} />
          <span>Actualiser</span>
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1240, margin: '0 auto' }}>
        {/* Operational KPI row */}
        <div className="kpi-grid">
          {[
            { label: 'Total dossiers', value: stats.total, color: 'var(--acc)', icon: Layers },
            { label: 'Dossiers actifs', value: stats.actifs, color: 'var(--text)', icon: CheckCircle2 },
            { label: 'Archivés', value: stats.archives, color: 'var(--text-3)', icon: Lock },
            { label: 'En retard', value: stats.enRetard, color: 'var(--red)', icon: AlertTriangle },
            { label: 'Terminés', value: stats.termines, color: 'var(--green)', icon: CheckCircle2 },
            { label: 'Bloqués', value: stats.bloques, color: 'var(--orange)', icon: Lock },
          ].map(k => {
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Volume d\'honoraires attendu', value: formatMontant(stats.totalMontant), color: 'var(--acc)', sub: 'Sur tous les dossiers actifs' },
            { label: 'Total honoraires perçus', value: formatMontant(stats.totalEncaisse), color: 'var(--green)', sub: 'Règlements comptabilisés' },
            { label: 'Créances restantes (Reste)', value: formatMontant(stats.totalReste), color: stats.totalReste > 0 ? 'var(--red)' : 'var(--green)', sub: 'En attente de paiement' },
            {
              label: 'Taux de recouvrement',
              value: `${stats.tauxRecouvrement}%`,
              color: stats.tauxRecouvrement >= 80 ? 'var(--green)' : stats.tauxRecouvrement >= 50 ? 'var(--yellow)' : 'var(--red)',
              sub: stats.tauxRecouvrement >= 80 ? 'Excellent niveau de recouvrement' : 'Relances recommandées'
            },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: k.color, margin: '6px 0 2px' }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="charts-grid">
          {/* By location */}
          <div className="chart-card">
            <div className="chart-title">
              <MapPin size={14} style={{ color: 'var(--acc)' }} />
              <span>Répartition par localité (Top 10)</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} angle={-20} textAnchor="end" height={40} />
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
              <span>Statuts & États d'avancement</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${Math.round(percent * 100)}%` : ''}>
                  {stats.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly trend */}
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-title">
              <Calendar size={14} style={{ color: 'var(--green)' }} />
              <span>Volume d'ouverture mensuelle des dossiers (12 derniers mois)</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="var(--acc)" strokeWidth={3} dot={{ fill: 'var(--acc)', r: 4 }} activeDot={{ r: 6 }} name="Dossiers créés" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue list */}
        {stats.recentOverdue.length > 0 && (
          <div className="chart-card">
            <div className="chart-title" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={15} />
              <span>Dossiers prioritaires en retard ({stats.recentOverdue.length})</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['N° Dossier', 'Nom du client', 'Localité', 'Date limite', 'Montant honoraires'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOverdue.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--acc)', fontWeight: 600 }}>{d.id}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{d.nom}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{d.endroit || '—'}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>
                      {d.date_finale ? format(parseISO(d.date_finale), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600 }}>{formatMontant(d.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
