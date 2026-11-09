import { eq, sql } from 'drizzle-orm';

import type { Db } from './db.js';
import { eventOrganisers, events, hackathonJudges, member } from './schema.js';

export type HackathonViewerRoles = {
  readonly isJudge: boolean;
  readonly isOrganiser: boolean;
};

/**
 * Whether a member judges a hackathon, having accepted, and whether they belong to the
 * organisation that leads it, in one read, so its page can lead them to their scoring or to its
 * management. Neither is a permission: each page they lead to checks again.
 */
export const readHackathonViewerRoles = async (
  db: Db,
  input: { readonly eventId: string; readonly userId: string },
): Promise<HackathonViewerRoles> => {
  const [row] = await db
    .select({
      isJudge: sql<number>`EXISTS (SELECT 1 FROM ${hackathonJudges} WHERE ${hackathonJudges.eventId} = ${input.eventId} AND ${hackathonJudges.userId} = ${input.userId} AND ${hackathonJudges.status} = 'accepted')`,
      isOrganiser: sql<number>`EXISTS (SELECT 1 FROM ${eventOrganisers} AS lead INNER JOIN ${member} AS joined ON joined.organization_id = lead.organisation_id WHERE lead.event_id = ${input.eventId} AND lead.role = 'lead' AND joined.user_id = ${input.userId})`,
    })
    .from(events)
    .where(eq(events.id, input.eventId));
  return {
    isJudge: Boolean(row?.isJudge),
    isOrganiser: Boolean(row?.isOrganiser),
  };
};
