import { describe, expect, it } from 'vitest';

import { publicResultsOf, type PublicResultInput } from './public-results.js';

const result = (
  submissionId: string,
  rank: number | null,
  changes: Partial<PublicResultInput> = {},
): PublicResultInput => ({
  submissionId,
  teamName: `${submissionId} team`,
  title: submissionId,
  trackId: null,
  trackTitle: null,
  total: rank === null ? null : 90,
  rank,
  trackRank: null,
  tieNote: null,
  criteria: [],
  pullRequestUrls: [],
  ...changes,
});

const inTrack = (trackId: string, trackRank: number) => ({
  trackId,
  trackTitle: `${trackId} title`,
  trackRank,
});

const prize = (id: string, place: number, trackId: string | null = null) => ({
  id,
  title: `${id} title`,
  place,
  trackId,
});

describe('publicResultsOf (B-JDG-10)', () => {
  it('is nothing until the results are out', () => {
    expect(publicResultsOf({ results: [], prizes: [], pullRequests: [] })).toBe(
      null,
    );
  });

  it('gives each prize the entry holding its place, overall or in its track', () => {
    const shown = publicResultsOf({
      results: [
        result('sub_a', 1, inTrack('trk_1', 1)),
        result('sub_b', 2, inTrack('trk_2', 1)),
        result('sub_c', 3, inTrack('trk_2', 2)),
      ],
      prizes: [
        prize('prz_first', 1),
        prize('prz_track', 2, 'trk_2'),
        prize('prz_nobody', 9),
      ],
      pullRequests: [],
    });

    expect(shown?.winners).toEqual([
      {
        prizeId: 'prz_first',
        place: 1,
        prizeTitle: 'prz_first title',
        trackTitle: null,
        title: 'sub_a',
        teamName: 'sub_a team',
      },
      {
        prizeId: 'prz_track',
        place: 2,
        prizeTitle: 'prz_track title',
        trackTitle: 'trk_2 title',
        title: 'sub_c',
        teamName: 'sub_c team',
      },
    ]);
  });

  it('ranks each track by its own ranks and leaves unranked entries out of it', () => {
    const shown = publicResultsOf({
      results: [
        result('sub_a', 1, inTrack('trk_1', 1)),
        result('sub_b', 2, inTrack('trk_1', 2)),
        result('sub_c', null, { trackId: 'trk_1', trackTitle: 'trk_1 title' }),
      ],
      prizes: [],
      pullRequests: [],
    });

    expect(shown?.tracks).toHaveLength(1);
    expect(shown?.tracks[0]?.title).toBe('trk_1 title');
    expect(
      shown?.tracks[0]?.entries.map((entry) => entry.submissionId),
    ).toEqual(['sub_a', 'sub_b']);
    expect(shown?.overall.map((entry) => entry.submissionId)).toEqual([
      'sub_a',
      'sub_b',
      'sub_c',
    ]);
  });

  it('never gives a prize to an unranked entry', () => {
    expect(
      publicResultsOf({
        results: [result('sub_a', null)],
        prizes: [prize('prz_first', 1)],
        pullRequests: [],
      })?.winners,
    ).toEqual([]);
  });

  it('shows each pull request as recorded, and as submitted when nobody reviewed it', () => {
    const shown = publicResultsOf({
      results: [
        result('sub_a', 1, {
          pullRequestUrls: ['https://g.example/1', 'https://g.example/2'],
        }),
      ],
      prizes: [],
      pullRequests: [
        {
          submissionId: 'sub_a',
          url: 'https://g.example/2',
          status: 'merged',
        },
        {
          submissionId: 'sub_other',
          url: 'https://g.example/1',
          status: 'reviewed',
        },
      ],
    });

    expect(shown?.overall[0]?.pullRequests).toEqual([
      { url: 'https://g.example/1', status: 'submitted' },
      { url: 'https://g.example/2', status: 'merged' },
    ]);
  });
});
