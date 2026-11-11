import { Link } from '@tanstack/react-router';
import { ArrowRight, FolderCheck, Trophy, Users } from 'lucide-react';

import {
  hackathon_organisers_apply,
  hackathon_organisers_intro,
  hackathon_organisers_judging_body,
  hackathon_organisers_judging_title,
  hackathon_organisers_label,
  hackathon_organisers_manage,
  hackathon_organisers_note,
  hackathon_organisers_registration_body,
  hackathon_organisers_registration_title,
  hackathon_organisers_submissions_body,
  hackathon_organisers_submissions_title,
  hackathon_organisers_title,
  type Locale,
} from '@founders-coffee/i18n';

import {
  localizedOrganisationApply,
  localizedProfileActivity,
} from '../../../lib/locale-routing';

const FEATURES = [
  {
    key: 'registration',
    icon: Users,
    title: hackathon_organisers_registration_title,
    body: hackathon_organisers_registration_body,
  },
  {
    key: 'submissions',
    icon: FolderCheck,
    title: hackathon_organisers_submissions_title,
    body: hackathon_organisers_submissions_body,
  },
  {
    key: 'judging',
    icon: Trophy,
    title: hackathon_organisers_judging_title,
    body: hackathon_organisers_judging_body,
  },
] as const;

export const HackathonOrganisers = ({
  locale,
  isEnabled,
}: {
  locale: Locale;
  isEnabled: boolean;
}) => {
  if (!isEnabled) return null;

  return (
    <section
      aria-labelledby="hackathon-organisers-title"
      className="mx-auto max-w-content px-4 pt-10 md:px-8 md:pt-14"
    >
      <div className="grid gap-8 rounded-box border border-base-300 bg-base-200 p-5 md:p-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <header>
          <p className="text-body-sm font-semibold text-secondary">
            {hackathon_organisers_label({}, { locale })}
          </p>
          <h2
            id="hackathon-organisers-title"
            className="mt-3 font-display text-h3 font-semibold tracking-tight text-balance text-base-content md:text-h2"
          >
            {hackathon_organisers_title({}, { locale })}
          </h2>
          <p className="mt-4 max-w-prose text-body-sm leading-relaxed text-pretty text-neutral md:text-body">
            {hackathon_organisers_intro({}, { locale })}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              {...localizedOrganisationApply(locale)}
              className="btn btn-primary btn-xs sm:btn-sm md:btn-md rounded-full border-0 shadow-none"
            >
              {hackathon_organisers_apply({}, { locale })}
              <ArrowRight
                aria-hidden="true"
                className="size-4 rtl:rotate-180"
              />
            </Link>
            <Link
              {...localizedProfileActivity(locale)}
              hash="my-organisations-heading"
              className="link link-hover rounded-field text-body-sm font-medium text-base-content"
            >
              {hackathon_organisers_manage({}, { locale })}
            </Link>
          </div>
          <p className="mt-4 max-w-prose text-caption leading-relaxed text-neutral">
            {hackathon_organisers_note({}, { locale })}
          </p>
        </header>

        <ul className="space-y-3">
          {FEATURES.map(({ key, icon: Icon, title, body }) => (
            <li
              key={key}
              className="flex items-start gap-4 rounded-box border border-base-300 bg-base-100 p-4 md:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-secondary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-body-lg font-semibold text-base-content">
                  {title({}, { locale })}
                </h3>
                <p className="mt-1 text-body-sm leading-relaxed text-neutral">
                  {body({}, { locale })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
