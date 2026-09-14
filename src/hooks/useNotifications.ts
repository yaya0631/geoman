import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { computeStatus } from '@/lib/status'
import { getEncaisse } from '@/lib/utils'

/**
 * Notifications navigateur (Web Notifications API).
 * - Demande la permission une seule fois.
 * - Envoie une alerte système quand un dossier passe "En retard" (nouveau).
 * - Ne spamme pas : un ID dossier déjà notifié n'est notifié qu'une fois par session.
 */
export function useNotifications() {
  const dossiers = useAppStore(s => s.dossiers)
  const settings = useAppStore(s => s.settings)
  const notifiedRef = useRef<Set<string>>(new Set())

  // Permettre la notification (l'utilisateur active/désactive dans les réglages)
  const requestPermission = () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    if (!settings.showRemindersOnStart || settings.enableBrowserNotifications === false) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const active = dossiers.filter(d => !d.in_trash && !d.archived)
    const overdue = active.filter(d => computeStatus(d, getEncaisse(d)) === 'En retard')

    overdue.forEach(d => {
      if (!notifiedRef.current.has(d.id)) {
        notifiedRef.current.add(d.id)
        new Notification(`⏰ GeoMan — Dossier en retard`, {
          body: `${d.id} — ${d.nom} (${d.endroit || 'localité non définie'})`,
          tag: `geoman-${d.id}`,
          icon: '/favicon.svg',
          silent: false,
        })
      }
    })
  }, [dossiers, settings.showRemindersOnStart, settings.enableBrowserNotifications])

  return { requestPermission }
}