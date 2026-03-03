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
import { ArrowLeft, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

const COLORS = ['#1d8aff', '#22c55e', '#f43f5e', '#eab308', '#a855f7', '#f97316', '#14b8a6']

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
    contentStyle: { background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 6, fontSize: 12 },
    labelStyle: { color: 'var(--text)' },
  }

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button className="btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Retour
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Tableau de bord analytique</span>
        <div style={{ flex: 1 }} />
        <button className="btn btn-icon" onClick={() => query.refetch()} title="Actualiser">
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--acc)' },
            { label: 'Actifs', value: stats.actifs, color: 'var(--text)' },
            { label: 'Archivés', value: stats.archives, color: 'var(--text-3)' },
            { label: 'En retard', value: stats.enRetard, color: 'var(--red)' },
            { label: 'Terminés', value: stats.termines, color: 'var(--green)' },
            { label: 'Bloqués', value: stats.bloques, color: 'var(--orange)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Financial KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Montant total', value: formatMontant(stats.totalMontant), color: 'var(--acc)' },
            { label: 'Total encaissé', value: formatMontant(stats.totalEncaisse), color: 'var(--green)' },
            { label: 'Reste à payer', value: formatMontant(stats.totalReste), color: 'var(--red)' },
            { label: 'Taux de recouvrement', value: `${stats.tauxRecouvrement}%`, color: stats.tauxRecouvrement >= 80 ? 'var(--green)' : stats.tauxRecouvrement >= 50 ? 'var(--yellow)' : 'var(--red)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: k.color, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* By location */}
          <div className="chart-card">
            <div className="chart-title">Dossiers par localité</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="var(--acc)" radius={[3, 3, 0, 0]} name="Dossiers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By status */}
          <div className="chart-card">
            <div className="chart-title">Répartition par état</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${Math.round(percent * 100)}%` : ''}>
                  {stats.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly trend */}
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-title">Évolution mensuelle des dossiers</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="var(--acc)" strokeWidth={2} dot={{ fill: 'var(--acc)', r: 4 }} name="Dossiers" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue list */}
        {stats.recentOverdue.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">⚠️ Dossiers en retard ({stats.recentOverdue.length})</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['N°', 'Client', 'Endroit', 'Échéance', 'Montant'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOverdue.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', color: 'var(--acc)', fontSize: 11.5 }}>{d.id}</td>
                    <td style={{ padding: '7px 8px', fontWeight: 500 }}>{d.nom}</td>
                    <td style={{ padding: '7px 8px', color: 'var(--text-3)' }}>{d.endroit || '—'}</td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', color: 'var(--red)', fontSize: 11.5 }}>
                      {d.date_finale ? format(parseISO(d.date_finale), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ padding: '7px 8px', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{formatMontant(d.montant)}</td>
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
