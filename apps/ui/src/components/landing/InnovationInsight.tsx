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
      <figure className="grid items-center gap-5 border-y border-base-300 py-8 text-center sm:grid-cols-[auto_1fr] sm:gap-x-8 sm:gap-y-4 sm:text-start md:gap-x-12 md:py-10">
        <p
          aria-hidden="true"
          className="relative w-fit justify-self-center font-display text-display leading-none font-semibold tracking-tight whitespace-nowrap text-accent"
        >
          <bdi>{percentage}</bdi>
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 320 26"
            preserveAspectRatio="none"
            className="absolute inset-x-0 -bottom-2 h-3 w-full text-secondary md:bottom-0 md:h-4"
          >
            <path
              d="M2 13C12 7 24 3 31 4C34 4 34 6 35 10C37 14 50 13 58 12C72 9 78 9 87 10C95 11 99 16 108 15C118 14 122 10 136 13C150 18 154 15 166 15C179 12 183 18 192 16C203 11 211 10 221 12C233 15 238 19 248 16C259 11 268 8 278 11C292 16 305 17 318 5L319 9C306 22 291 19 277 16C267 13 261 16 251 21C239 26 233 19 220 18C208 14 206 18 194 21C182 25 177 19 166 20C153 23 147 23 135 19C124 16 120 22 108 22C96 23 93 17 84 17C72 17 65 21 51 21C34 22 28 18 28 13C21 13 13 18 4 20Z"
              fill="currentColor"
            />
          </svg>
        </p>
        <figcaption className="sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:grid sm:grid-rows-subgrid sm:self-stretch">
          <h2
            id="innovation-insight-title"
            className="max-w-prose font-display text-h3 leading-snug font-medium text-pretty text-base-content sm:self-center md:text-h2"
          >
            <span className="sr-only">{percentage} </span>
            {innovation_stat_statement({}, { locale })}
          </h2>
          <a
            href={SURVEY_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover tap-target mt-4 inline-flex items-center gap-1 rounded-field text-caption text-neutral sm:mt-0 sm:justify-self-start"
          >
            {innovation_stat_source({}, { locale })}
            <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
          </a>
        </figcaption>
      </figure>
    </section>
  );
};
