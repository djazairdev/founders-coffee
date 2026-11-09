import type {
  AttendanceMode,
  HackathonRegistrationStatus,
} from '@founders-coffee/core';
import {
  readHackathonRegistration,
  readHackathonViewerRoles,
  type Db,
} from '@founders-coffee/db';

export type HackathonRegistrationView = {
  readonly isFull: boolean;
  readonly viewer: {
    readonly status: HackathonRegistrationStatus;
    readonly attendanceMode: AttendanceMode;
  } | null;
  readonly isJudge: boolean;
  readonly isOrganiser: boolean;
};

/**
 * What a hackathon page's registration card needs (B-REG-06): whether every place is taken, so a
 * new registration joins the waitlist, and the reader's own registration, read only for a reader
 * who is signed in, with whether they judge it or belong to the organisation leading it, so the card
 * can lead them to their team, their scoring or its management. `null` for anything but a hackathon with its details.
 */
export const hackathonRegistrationView = async (
  db: Db,
  input: {
    readonly eventId: string;
    readonly places: {
      readonly capacity: number | null;
      readonly registeredCount: number;
    } | null;
    readonly viewerId: string | undefined;
  },
): Promise<HackathonRegistrationView | null> => {
  if (!input.places) return null;
  const { capacity, registeredCount } = input.places;
  const viewer = input.viewerId
    ? { eventId: input.eventId, userId: input.viewerId }
    : null;
  const [registration, roles] = viewer
    ? await Promise.all([
        readHackathonRegistration(db, viewer),
        readHackathonViewerRoles(db, viewer),
      ])
    : [null, { isJudge: false, isOrganiser: false }];
  return {
    isFull: capacity !== null && registeredCount >= capacity,
    viewer: registration,
    ...roles,
  };
};
