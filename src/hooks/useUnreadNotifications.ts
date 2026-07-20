import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useUnreadNotifications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user!.id)
        .eq('is_read', false)

      if (error) throw error
      return count ?? 0
    },
    refetchInterval: 60_000,
  })
}
