import { beforeEach, describe, expect, it } from 'vitest';

import {
  accountPreferences,
  and,
  eq,
  hackathons as hackathonRows,
  scheduledNotifications,
  user,
  type Db,
} from '@founders-coffee/db';

import {
  captain,
  judgeOf,
  member,
  submitted,
} from '../hackathons/judging.fixtures.js';
import { setHackathons } from '../hackathons/registration.fixtures.js';
import { setupDb } from '../rsvps/resolver.fixtures.js';
import { enqueueResultsNoticeBatch } from './hackathon-results-notices.js';

let db: Db;

const published = async () => {
  const { eventId } = await submitted(db);
  await db
    .update(hackathonRows)
    .set({ resultsPublishedAt: new Date() })
    .where(eq(hackathonRows.eventId, eventId));
  return eventId;
};

const noticesOf = (eventId: string) =>
  db
    .select({
      userId: scheduledNotifications.userId,
      payload: scheduledNotifications.payload,
    })
    .from(scheduledNotifications)
    .where(
      and(
        eq(scheduledNotifications.eventId, eventId),
        eq(scheduledNotifications.templateKey, 'hackathon_results_published'),
      ),
    );

const recipientsOf = async (eventId: string) =>
  (await noticesOf(eventId)).map((row) => row.userId).sort();

describe('telling a hackathon its results are out (B-JDG-11, real D1)', () => {
  beforeEach(async () => {
    db = await setupDb();
    await setHackathons(db, true);
  });

  it('tells every registered participant and accepted judge, once', async () => {
    const eventId = await published();
    const judge = await judgeOf(db, eventId);
    await judgeOf(db, eventId, 'invited');
    const everyone = [captain, member, judge.userId].sort();
    const batch = { eventId, afterUserId: null, limit: 50 };

    expect(await enqueueResultsNoticeBatch(db, batch)).toEqual({
      written: 3,
      next: null,
    });
    expect(await recipientsOf(eventId)).toEqual(everyone);

    expect(await enqueueResultsNoticeBatch(db, batch)).toEqual({
      written: 0,
      next: null,
    });
    expect(await recipientsOf(eventId)).toEqual(everyone);
  });

  it('pages through the list without missing anyone or repeating anyone', async () => {
    const eventId = await published();
    const judge = await judgeOf(db, eventId);
    let afterUserId: string | null = null;
    let batches = 0;
    do {
      const { next }: { next: string | null } = await enqueueResultsNoticeBatch(
        db,
        { eventId, afterUserId, limit: 1 },
      );
      afterUserId = next;
      batches += 1;
    } while (afterUserId && batches < 10);

    expect(await recipientsOf(eventId)).toEqual(
      [captain, member, judge.userId].sort(),
    );
    expect(batches).toBeLessThanOrEqual(4);
  });

  it('writes in the reader’s language, links to the hackathon’s page and honours the off switch', async () => {
    const eventId = await published();
    await db.update(user).set({ localePref: 'ar' }).where(eq(user.id, captain));
    await db
      .insert(accountPreferences)
      .values({ userId: member, hackathons: false, hackathonsChannels: 0 });

    await enqueueResultsNoticeBatch(db, {
      eventId,
      afterUserId: null,
      limit: 50,
    });

    const notices = await noticesOf(eventId);
    expect(notices.map((row) => row.userId)).toEqual([captain]);
    const payload = notices[0]?.payload as {
      pushTitle: string;
      pushUrl: string;
    };
    expect(payload.pushTitle).toContain('نُشرت النتائج');
    expect(payload.pushUrl).toContain('/ar/');
    expect(payload.pushUrl).toContain('/e/');
  });

  it('writes nothing while the results are not out', async () => {
    const { eventId } = await submitted(db);

    expect(
      await enqueueResultsNoticeBatch(db, {
        eventId,
        afterUserId: null,
        limit: 50,
      }),
    ).toEqual({ written: 0, next: null });
    expect(await noticesOf(eventId)).toEqual([]);
  });
});
