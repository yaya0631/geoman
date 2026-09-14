const LEGEND = [
  { color: 'var(--red)', label: 'En retard' },
  { color: 'var(--yellow)', label: 'Échéance proche (≤ 7j)' },
  { color: 'var(--purple)', label: 'Soldé partiel' },
  { color: 'var(--green)', label: 'Terminé & soldé' },
  { color: 'var(--teal)', label: 'En attente' },
  { color: 'var(--orange)', label: 'Bloqué' },
  { color: 'var(--text-dim)', label: 'Archivé', border: true },
]

export default function Legend() {
  return (
    <div className="legend-bar">
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginRight: 4 }}>
        Code couleur :
      </span>
      {LEGEND.map(item => (
        <div key={item.label} className="legend-item">
          <div
            className="legend-dot"
            style={{
              background: item.color,
              boxShadow: `0 0 5px ${item.color}`,
              border: item.border ? '1px solid var(--border-2)' : undefined,
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
