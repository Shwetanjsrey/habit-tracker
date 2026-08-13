import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '../api/analytics';

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    // Analytics change whenever completions do; keep it a bit fresher than
    // the 5 minute app default since it's a summary view users check often.
    staleTime: 1000 * 60,
  });
}
