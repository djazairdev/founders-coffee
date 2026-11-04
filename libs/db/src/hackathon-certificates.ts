import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  sql,
  type SQL,
} from 'drizzle-orm';

import type { HackathonCertificateKind } from '@founders-coffee/core';

import type { Db } from './db.js';
import { bound } from './insert-select.js';
import {
  hackathonCertificates,
  hackathonResults,
  hackathonTeamMembers,
} from './schema.js';

export type NewCertificate = {
  readonly id: string;
  readonly userId: string;
  readonly kind: HackathonCertificateKind;
  readonly placement: string | null;
  readonly verificationCode: string;
};

const field = (key: keyof NewCertificate, column: string) =>
  sql.raw(`json_extract(value, '$.${key}')`).as(column);

/**
 * The statement that writes a hackathon's certificates in one go, however many there are, for the
 * batch that publishes its results (B-CRT-01). They travel as one JSON value, since D1 allows a
 * statement only 100 bound values. `isIssued` is the batch's check that this publication went ahead.
 */
export const issueCertificatesStatement = (
  db: Db,
  input: {
    readonly eventId: string;
    readonly certificates: readonly NewCertificate[];
    readonly issuedAt: Date;
    readonly isIssued: SQL;
  },
) =>
  db.insert(hackathonCertificates).select(
    db
      .select({
        id: field('id', 'id'),
        eventId: bound(input.eventId, 'event_id'),
        userId: field('userId', 'user_id'),
        kind: field('kind', 'kind'),
        placement: field('placement', 'placement'),
        verificationCode: field('verificationCode', 'verification_code'),
        issuedAt: bound(
          Math.floor(input.issuedAt.getTime() / 1000),
          'issued_at',
        ),
        revokedAt: sql`NULL`.as('revoked_at'),
      })
      .from(sql`json_each(${JSON.stringify(input.certificates)})`)
      .where(input.isIssued),
  );

/**
 * The statement that takes back what a disqualified team's members earned from a hackathon (B-CRT-01),
 * for the batch that decides it. A judge's certificate stays, even when the judge is on the team:
 * it is for the judging.
 */
export const revokeTeamCertificatesStatement = (
  db: Db,
  input: {
    readonly eventId: string;
    readonly teamId: string;
    readonly revokedAt: Date;
    readonly isRevoked: SQL;
  },
) =>
  db
    .update(hackathonCertificates)
    .set({ revokedAt: input.revokedAt })
    .where(
      and(
        eq(hackathonCertificates.eventId, input.eventId),
        ne(hackathonCertificates.kind, 'judge'),
        isNull(hackathonCertificates.revokedAt),
        inArray(
          hackathonCertificates.userId,
          db
            .select({ userId: hackathonTeamMembers.userId })
            .from(hackathonTeamMembers)
            .where(eq(hackathonTeamMembers.teamId, input.teamId)),
        ),
        input.isRevoked,
      ),
    );

/**
 * The statement that takes back what the teams already marked disqualified in a hackathon's frozen
 * results earned, for an entry disqualified just as the results were published (B-SAFE-03).
 */
export const revokeDisqualifiedCertificatesStatement = (
  db: Db,
  input: {
    readonly eventId: string;
    readonly revokedAt: Date;
    readonly isRevoked: SQL;
  },
) =>
  db
    .update(hackathonCertificates)
    .set({ revokedAt: input.revokedAt })
    .where(
      and(
        eq(hackathonCertificates.eventId, input.eventId),
        ne(hackathonCertificates.kind, 'judge'),
        inArray(
          hackathonCertificates.userId,
          db
            .select({ userId: hackathonTeamMembers.userId })
            .from(hackathonTeamMembers)
            .innerJoin(
              hackathonResults,
              eq(hackathonResults.teamId, hackathonTeamMembers.teamId),
            )
            .where(
              and(
                eq(hackathonResults.eventId, input.eventId),
                isNotNull(hackathonResults.disqualifiedAt),
              ),
            ),
        ),
        input.isRevoked,
      ),
    );

/** Who is in which team of a hackathon. */
export const listEventTeamMembers = (db: Db, eventId: string) =>
  db
    .select({
      teamId: hackathonTeamMembers.teamId,
      userId: hackathonTeamMembers.userId,
    })
    .from(hackathonTeamMembers)
    .where(eq(hackathonTeamMembers.eventId, eventId));
