import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hackathonResultsApi, type HackathonResultsView } from './api';

const RESULTS = ['hackathons', 'results'] as const;

/** Where a hackathon's results stand for its organisers (B-JDG-09). */
export const useHackathonResults = (eventId: string, isEnabled: boolean) =>
  useQuery<HackathonResultsView>({
    queryKey: [...RESULTS, eventId],
    queryFn: () => hackathonResultsApi.results(eventId),
    enabled: isEnabled,
  });

/** Publish the results, then read them again, whether it worked or not. */
export const usePublishHackathonResults = (eventId: string) => {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: hackathonResultsApi.publish,
    onSettled: () =>
      cache.invalidateQueries({ queryKey: [...RESULTS, eventId] }),
  });
};
