import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSync() {
  const { setConnectionStatus } = useAppStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    setConnectionStatus('connecting')

    const channel = supabase
      .channel('dossiers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dossiers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paiements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (status === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
