import { and, asc, eq } from 'drizzle-orm';

import type {
  AttendanceMode,
  HackathonRegistrationStatus,
} from '@founders-coffee/core';

import type { Db } from './db.js';
import {
  hackathonRegistrations,
  hackathonTeamMembers,
  hackathonTeams,
  user,
} from './schema.js';

export const HACKATHON_ORGANISER_LIST_MAX = 1000;

export type HackathonParticipant = {
  readonly userId: string;
  readonly name: string;
  readonly attendanceMode: AttendanceMode;
  readonly status: HackathonRegistrationStatus;
  readonly teamName: string | null;
};

/**
 * Everyone who registered for a hackathon, in the order they did, each with the team they are on,
 * for its organisers (B-REG-08). No contact details: the list has no export, and an organiser reads
 * a name and a standing here, not an address to write to.
 */
export const listHackathonParticipants = async (
  db: Db,
  eventId: string,
  limit: number = HACKATHON_ORGANISER_LIST_MAX,
): Promise<{
  readonly participants: readonly HackathonParticipant[];
  readonly isTruncated: boolean;
}> => {
  const rows = await db
    .select({
      userId: hackathonRegistrations.userId,
      name: user.name,
      attendanceMode: hackathonRegistrations.attendanceMode,
      status: hackathonRegistrations.status,
      teamName: hackathonTeams.name,
    })
    .from(hackathonRegistrations)
    .innerJoin(user, eq(user.id, hackathonRegistrations.userId))
    .leftJoin(
      hackathonTeamMembers,
      and(
        eq(hackathonTeamMembers.eventId, hackathonRegistrations.eventId),
        eq(hackathonTeamMembers.userId, hackathonRegistrations.userId),
      ),
    )
    .leftJoin(
      hackathonTeams,
      eq(hackathonTeams.id, hackathonTeamMembers.teamId),
    )
    .where(eq(hackathonRegistrations.eventId, eventId))
    .orderBy(
      asc(hackathonRegistrations.createdAt),
      asc(hackathonRegistrations.id),
    )
    .limit(limit + 1);
  return {
    participants: rows.slice(0, limit),
    isTruncated: rows.length > limit,
  };
};
