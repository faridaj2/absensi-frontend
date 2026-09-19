import { useMemo } from 'react';
import {
  TimeField as AriaTimeField,
  DateInput,
  DateSegment,
} from 'react-aria-components';
import { I18nProvider } from '@react-aria/i18n';
import { parseTime } from '@internationalized/date';

function toValue(str) {
  if (!str) return null;
  try {
    return parseTime(str);
  } catch {
    return null;
  }
}

export default function TimeField({ value, onChange, label, className = '', granularity = 'minute' }) {
  const aria = useMemo(() => toValue(value), [value]);

  return (
    <I18nProvider locale="id-ID">
    <AriaTimeField
      value={aria}
      onChange={(t) => onChange(t ? t.toString().slice(0, 5) : '')}
      granularity={granularity}
      hourCycle={24}
      className={`flex flex-col gap-1.5 ${className}`}
    >
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <div className="flex w-full items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary transition-all duration-200 focus-within:border-brand-500 focus-within:bg-surface-card focus-within:ring-2 focus-within:ring-brand-200">
        <span className="text-text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <DateInput className="flex flex-1 gap-0.5">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums outline-none data-[placeholder]:text-text-muted data-[focused]:bg-brand-200 data-[focused]:text-brand-900"
            />
          )}
        </DateInput>
      </div>
    </AriaTimeField>
    </I18nProvider>
  );
}
