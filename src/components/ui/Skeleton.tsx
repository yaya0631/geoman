import { CSSProperties } from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  style?: CSSProperties
  className?: string
}

/**
 * Bloc skeleton animé — remplace les spinners par un placeholder
 * visuel qui laisse deviner la forme du contenu à charger.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style, className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/**
 * Skeleton de ligne de tableau — imite la forme d'une row de données.
 */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ padding: '0 16px' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={12} width={`${100 / columns}%`} borderRadius={4} />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            gap: 16,
            padding: '14px 0',
            borderBottom: '1px solid var(--border)',
            opacity: 1 - rowIdx * 0.08,
          }}
        >
          <Skeleton height={14} width={40} borderRadius={4} />
          <Skeleton height={14} width={100} borderRadius={4} />
          <Skeleton height={14} width={140} borderRadius={4} />
          <Skeleton height={14} width={110} borderRadius={4} />
          <Skeleton height={14} width={90} borderRadius={4} />
          <Skeleton height={14} width={120} borderRadius={4} />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton de carte KPI — pour le dashboard.
 */
export function CardSkeleton() {
  return (
    <div style={{
      padding: 20,
      background: 'var(--bg-2)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <Skeleton height={12} width={80} borderRadius={4} />
      <Skeleton height={28} width={120} borderRadius={6} />
      <Skeleton height={10} width={100} borderRadius={4} />
    </div>
  )
}
