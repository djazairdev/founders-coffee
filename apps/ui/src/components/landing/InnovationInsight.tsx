import { ArrowUpRight } from 'lucide-react';

import {
  formatNumber,
  innovation_stat_source,
  innovation_stat_statement,
  type Locale,
} from '@founders-coffee/i18n';

const SURVEY_SOURCE =
  'https://www.bcg.com/publications/2024/innovation-systems-need-a-reboot';

export const InnovationInsight = ({ locale }: { locale: Locale }) => {
  const percentage = formatNumber(0.83, locale, { style: 'percent' });

  return (
    <section
      aria-labelledby="innovation-insight-title"
      className="mx-auto max-w-content px-4 pt-10 md:px-8 md:pt-14"
    >
      <figure className="grid items-center gap-5 border-y border-base-300 py-8 text-center sm:grid-cols-[auto_1fr] sm:gap-8 sm:text-start md:gap-12 md:py-10">
        <p
          aria-hidden="true"
          className="font-display text-display leading-none font-semibold tracking-tight whitespace-nowrap text-accent"
        >
          <bdi>{percentage}</bdi>
        </p>
        <figcaption>
          <h2
            id="innovation-insight-title"
            className="max-w-prose font-display text-h3 leading-snug font-medium text-pretty text-base-content md:text-h2"
          >
            <span className="sr-only">{percentage} </span>
            {innovation_stat_statement({}, { locale })}
          </h2>
          <a
            href={SURVEY_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover tap-target mt-4 inline-flex items-center gap-1 rounded-field text-caption text-neutral"
          >
            {innovation_stat_source({}, { locale })}
            <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
        </figcaption>
      </figure>
    </section>
  );
};
