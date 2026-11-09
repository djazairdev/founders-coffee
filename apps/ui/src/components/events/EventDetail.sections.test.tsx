import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EventDetailItem } from '@founders-coffee/server-fns';

import type { HackathonPageDetails } from '../../features/hackathons/api';
import { event, market } from './EventDetail.fixtures';

vi.mock('../../features/hackathons/components/HackathonPageDetails', () => ({
  HackathonPageDetails: () => <section aria-label="Rules" />,
}));

const { EventDetail } = await import('./EventDetail');

afterEach(cleanup);

const show = (kind: EventDetailItem['kind'], details?: HackathonPageDetails) =>
  render(
    <EventDetail
      locale="en"
      market={market}
      event={{ ...event, kind }}
      host={null}
      isHost={false}
      live={null}
      isWindowOpen={false}
      phase="upcoming"
      mapboxToken={null}
      details={details}
    />,
  );

describe('what the details of an event are called (#477)', () => {
  it('calls a meetup a meetup', () => {
    show('meetup');

    expect(
      screen.getByRole('heading', { name: 'Meetup details' }),
    ).toBeTruthy();
  });

  it.each(['workshop', 'hackathon'] as const)(
    'does not call a %s a meetup',
    (kind) => {
      show(kind);

      expect(screen.getByRole('heading', { name: 'Details' })).toBeTruthy();
      expect(
        screen.queryByRole('heading', { name: 'Meetup details' }),
      ).toBeNull();
    },
  );

  it('keeps the sections of a hackathon out of its details, after them', () => {
    show('hackathon', {} as HackathonPageDetails);

    const details = screen.getByRole('region', { name: 'Details' });
    const rules = screen.getByRole('region', { name: 'Rules' });

    expect(details.contains(rules)).toBe(false);
    expect(details.parentElement?.contains(rules)).toBe(false);
    expect(
      details.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
