import { Save } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  direction,
  optional,
  save,
  saving,
  org_apply_description,
  org_apply_error_failed,
  org_apply_error_rate_limited,
  org_apply_kind,
  org_apply_kind_choose,
  org_apply_name,
  org_apply_website,
  type Locale,
} from '@founders-coffee/i18n';
import {
  fieldNoteId,
  FormField,
  Input,
  ListboxSelect,
  StatusMessage,
} from '@founders-coffee/ui';

import { HackathonsUnavailable } from '../../hackathons/components/HackathonsUnavailable';
import {
  APPLICANT_KINDS,
  applicationFrom,
  DESCRIPTION_LENGTH,
  emptyApplication,
  NAME_LENGTH,
  type ApplicationField as Field,
  type ApplicationDraft,
} from '../application';
import { applicationFieldError, applicationRefusal } from '../errors';
import { useApplyForOrganisation } from '../hooks';
import { KIND_LABELS } from '../kind-labels';

type Problem = 'unavailable' | 'rate_limited' | 'failed';
type Focusable = { focus: () => void };

export const OrganisationApplyForm = ({
  locale,
  onSent,
}: {
  locale: Locale;
  onSent: (sent: { readonly name: string; readonly slug: string }) => void;
}) => {
  const [draft, setDraft] = useState(emptyApplication);
  const [invalid, setInvalid] = useState<Field | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const apply = useApplyForOrganisation();
  const controls = useRef<Partial<Record<Field, Focusable | null>>>({});
  const bind = (field: Field) => (element: Focusable | null) => {
    controls.current[field] = element;
  };
  const isBusy = apply.isPending;
  const [focusOn, setFocusOn] = useState<Field | null>(null);

  useEffect(() => {
    if (!focusOn || isBusy) return;
    controls.current[focusOn]?.focus();
    setFocusOn(null);
  }, [focusOn, isBusy]);

  const change = (field: Field, next: ApplicationDraft) => {
    setDraft(next);
    if (invalid === field) setInvalid(null);
  };

  const point = (field: Field) => {
    setInvalid(field);
    setFocusOn(field);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isBusy) return;
    setProblem(null);
    const checked = applicationFrom(draft);
    if (!checked.ok) {
      point(checked.field);
      return;
    }
    try {
      const created = await apply.mutateAsync(checked.application);
      onSent({ name: created.name, slug: created.slug });
    } catch (caught) {
      const refusal = applicationRefusal(caught);
      if (refusal.kind === 'hackathons_disabled') setProblem('unavailable');
      else
        setProblem(refusal.kind === 'rate_limited' ? 'rate_limited' : 'failed');
    }
  };

  const errorFor = (field: Field): string | null =>
    invalid === field ? applicationFieldError(field, locale) : null;

  const describe = (field: Field, id: string) => ({
    'aria-invalid': errorFor(field) ? true : undefined,
    'aria-describedby': errorFor(field) ? fieldNoteId(id) : undefined,
  });
  const optionalLabel = optional({}, { locale });

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <FormField
        error={errorFor('name')}
        id="organisation-name"
        label={org_apply_name({}, { locale })}
        optionalLabel={optionalLabel}
      >
        <Input
          {...describe('name', 'organisation-name')}
          autoComplete="organization"
          disabled={isBusy}
          id="organisation-name"
          maxLength={NAME_LENGTH.max}
          onChange={(event) =>
            change('name', { ...draft, name: event.target.value })
          }
          ref={bind('name')}
          value={draft.name}
        />
      </FormField>
      <FormField
        error={errorFor('kind')}
        id="organisation-kind"
        label={org_apply_kind({}, { locale })}
        optionalLabel={optionalLabel}
      >
        <ListboxSelect
          {...describe('kind', 'organisation-kind')}
          dir={direction(locale)}
          disabled={isBusy}
          id="organisation-kind"
          onChange={(kind) =>
            change('kind', { ...draft, kind: kind as ApplicationDraft['kind'] })
          }
          options={APPLICANT_KINDS.map((kind) => ({
            value: kind,
            label: KIND_LABELS[kind]({}, { locale }),
          }))}
          placeholder={org_apply_kind_choose({}, { locale })}
          ref={bind('kind')}
          value={draft.kind}
        />
      </FormField>
      <FormField
        aside={
          <span className="shrink-0 text-caption text-neutral" dir="ltr">
            {draft.description.trim().length} / {DESCRIPTION_LENGTH.max}
          </span>
        }
        error={errorFor('description')}
        id="organisation-description"
        label={org_apply_description({}, { locale })}
        optionalLabel={optionalLabel}
      >
        <textarea
          {...describe('description', 'organisation-description')}
          className="textarea textarea-sm md:textarea-md w-full"
          dir="auto"
          disabled={isBusy}
          id="organisation-description"
          maxLength={DESCRIPTION_LENGTH.max}
          onChange={(event) =>
            change('description', {
              ...draft,
              description: event.target.value,
            })
          }
          ref={bind('description')}
          rows={5}
          value={draft.description}
        />
      </FormField>
      <FormField
        error={errorFor('websiteUrl')}
        id="organisation-website"
        isOptional
        label={org_apply_website({}, { locale })}
        optionalLabel={optionalLabel}
      >
        <Input
          {...describe('websiteUrl', 'organisation-website')}
          autoComplete="url"
          disabled={isBusy}
          id="organisation-website"
          inputMode="url"
          onChange={(event) =>
            change('websiteUrl', { ...draft, websiteUrl: event.target.value })
          }
          placeholder="https://"
          ref={bind('websiteUrl')}
          type="url"
          value={draft.websiteUrl}
        />
      </FormField>
      {problem === 'unavailable' ? (
        <HackathonsUnavailable locale={locale} />
      ) : null}
      {problem === 'rate_limited' || problem === 'failed' ? (
        <StatusMessage variant="error">
          {problem === 'rate_limited'
            ? org_apply_error_rate_limited({}, { locale })
            : org_apply_error_failed({}, { locale })}
        </StatusMessage>
      ) : null}
      <button
        className="btn btn-primary btn-xs sm:btn-sm md:btn-md"
        disabled={isBusy}
        type="submit"
      >
        <Save aria-hidden="true" className="size-4" />
        {isBusy ? saving({}, { locale }) : save({}, { locale })}
      </button>
    </form>
  );
};
