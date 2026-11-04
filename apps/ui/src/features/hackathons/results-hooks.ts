import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  hackathonResultsApi,
  type HackathonResultsView,
  type JudgingProgressView,
} from './api';

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

/** How far each judge has got, for a hackathon's organisers (B-JDG-08). */
export const useHackathonJudgingProgress = (eventId: string) =>
  useQuery<JudgingProgressView>({
    queryKey: [...RESULTS, eventId, 'judges'],
    queryFn: () => hackathonResultsApi.judges(eventId),
  });

/** Remind the judges who still have scores to give. */
export const useRemindHackathonJudges = (eventId: string) =>
  useMutation<
    { readonly reminded: number; readonly alreadyReminded: number },
    Error,
    void
  >({ mutationFn: () => hackathonResultsApi.remind(eventId) });
