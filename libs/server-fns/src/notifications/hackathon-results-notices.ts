import type { Locale } from '@founders-coffee/core';
import {
  enqueueNotificationIfAbsent,
  getHackathon,
  getNotificationContact,
  listResultsNoticeRecipients,
  type Db,
} from '@founders-coffee/db';

import { channelPlanFor } from './channel-plan.js';
import { resolveNotificationContext } from './context.js';
import { hackathonTeamMessage } from './hackathon-team.js';
import {
  validPayload,
  valuesFor,
  type NotificationPayload,
} from './producer.js';
import { armNotificationSchedule } from './schedule.js';

const TEMPLATE_KEY = 'hackathon_results_published';

/**
 * Write one batch of the notice that a hackathon's results are out (B-JDG-11), one row per member in
 * their language, following their Hackathons category. Each row's id is fixed by the hackathon and
 * the member, so a queue message delivered twice writes nothing new. Answers where the next batch
 * starts, `null` once the list is done.
 */
export const enqueueResultsNoticeBatch = async (
  db: Db,
  input: {
    readonly eventId: string;
    readonly afterUserId: string | null;
    readonly limit: number;
  },
): Promise<{ readonly written: number; readonly next: string | null }> => {
  const found = await getHackathon(db, input.eventId);
  if (!found?.hackathon.resultsPublishedAt) return { written: 0, next: null };
  const { event } = found;
  const recipients = await listResultsNoticeRecipients(db, input);
  const sendAt = new Date();
  const messages = new Map<Locale, Record<string, string>>();
  let written = 0;
  for (const userId of recipients) {
    const contact = await getNotificationContact(db, userId);
    const plan = contact && channelPlanFor(contact, TEMPLATE_KEY);
    if (!contact || !plan) continue;
    const context = await resolveNotificationContext(db, {
      preferred: contact.localePref,
      marketCode: event.marketCode,
    });
    const base: NotificationPayload = {
      email: contact.email,
      eventTitle: event.title,
      eventSlug: event.slug,
      marketCode: event.marketCode,
      startsAt: event.startsAt.toISOString(),
      locale: context.locale,
    };
    const message =
      messages.get(context.locale) ??
      (await hackathonTeamMessage(
        TEMPLATE_KEY,
        {
          title: event.title,
          team: '',
          name: '',
          project: '',
          reason: '',
          url: valuesFor(base, context, true).url,
        },
        context.locale,
      ));
    messages.set(context.locale, message);
    const payload = { ...base, ...message };
    const queued = await enqueueNotificationIfAbsent(db, {
      id: `ntf_results_${event.id}_${userId}`,
      eventId: event.id,
      userId,
      channel: plan.primary,
      templateKey: TEMPLATE_KEY,
      payload: plan.fallback
        ? validPayload(plan.fallback, validPayload(plan.primary, payload))
        : validPayload(plan.primary, payload),
      sendAt,
      fallbackChannel: plan.fallback ?? undefined,
    });
    if (queued.written) written += 1;
  }
  if (written > 0) await armNotificationSchedule(event.id, sendAt);
  return {
    written,
    next:
      recipients.length === input.limit ? (recipients.at(-1) ?? null) : null,
  };
};
