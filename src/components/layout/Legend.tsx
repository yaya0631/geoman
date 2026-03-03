const LEGEND = [
  { color: 'var(--red)', label: 'En retard' },
  { color: 'var(--yellow)', label: 'Échéance proche' },
  { color: 'var(--purple)', label: 'Soldé partiel' },
  { color: 'var(--green)', label: 'Terminé' },
  { color: 'var(--text-3)', label: 'En attente' },
  { color: 'var(--orange)', label: 'Bloqué' },
  { color: 'var(--bg-3)', label: 'Archivé', border: true },
]

export default function Legend() {
  return (
    <div className="legend-bar">
      <span style={{ fontSize: 10.5, color: 'var(--text-dim)', marginRight: 4 }}>Légende:</span>
      {LEGEND.map(item => (
        <div key={item.label} className="legend-item">
          <div
            className="legend-dot"
            style={{
              background: item.color,
              border: item.border ? '1px solid var(--border-2)' : undefined,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  )
}
