import { sql } from 'drizzle-orm';

import type { Db } from './db.js';
import {
  hackathonJudges,
  hackathonRegistrations,
  hackathonResults,
  hackathonTeamMembers,
} from './schema.js';

/**
 * The next members to tell a hackathon's results are out (B-JDG-11), in a stable order to page by:
 * everyone holding a place and every judge who accepted, each once. A member whose team was given
 * scores also has feedback to read (B-JDG-12).
 */
export const listResultsNoticeRecipients = async (
  db: Db,
  input: {
    readonly eventId: string;
    readonly afterUserId: string | null;
    readonly limit: number;
  },
): Promise<
  readonly { readonly userId: string; readonly hasFeedback: boolean }[]
> => {
  const rows = await db.all<{ userId: string; hasFeedback: number }>(sql`
    SELECT recipient.user_id AS userId, EXISTS (
      SELECT 1 FROM ${hackathonTeamMembers}
      INNER JOIN ${hackathonResults} ON ${hackathonResults.teamId} = ${hackathonTeamMembers.teamId}
      WHERE ${hackathonTeamMembers.eventId} = ${input.eventId}
        AND ${hackathonTeamMembers.userId} = recipient.user_id
        AND ${hackathonResults.total} IS NOT NULL
    ) AS hasFeedback FROM (
      SELECT ${hackathonRegistrations.userId} AS user_id FROM ${hackathonRegistrations}
      WHERE ${hackathonRegistrations.eventId} = ${input.eventId}
        AND ${hackathonRegistrations.status} = 'registered'
      UNION
      SELECT ${hackathonJudges.userId} AS user_id FROM ${hackathonJudges}
      WHERE ${hackathonJudges.eventId} = ${input.eventId}
        AND ${hackathonJudges.status} = 'accepted'
        AND ${hackathonJudges.userId} IS NOT NULL
    ) AS recipient
    WHERE recipient.user_id > ${input.afterUserId ?? ''}
    ORDER BY recipient.user_id
    LIMIT ${input.limit}
  `);
  return rows.map((row) => ({
    userId: row.userId,
    hasFeedback: row.hasFeedback === 1,
  }));
};
