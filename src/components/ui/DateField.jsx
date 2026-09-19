import { useMemo } from 'react';
import {
  DatePicker as AriaDatePicker,
  Group,
  DateInput,
  DateSegment,
  Button as AriaButton,
  Popover,
  Calendar,
  CalendarGrid,
  CalendarCell,
  Heading,
} from 'react-aria-components';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';

function toValue(str) {
  if (!str) return null;
  try {
    return parseDate(str);
  } catch {
    return null;
  }
}

export default function DateField({ value, onChange, label, className = '' }) {
  const aria = useMemo(() => toValue(value), [value]);

  return (
    <AriaDatePicker
      value={aria}
      onChange={(d) => onChange(d ? d.toString() : '')}
      className={`flex flex-col gap-1.5 ${className}`}
    >
      {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      <Group className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 hover:border-brand-200 focus-within:border-brand-500 focus-within:bg-surface-card focus-within:ring-2 focus-within:ring-brand-200 data-[focus-visible]:border-brand-500">
        <DateInput className="flex flex-1 gap-0.5">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums outline-none data-[placeholder]:text-text-muted data-[focused]:bg-brand-200 data-[focused]:text-brand-900"
            />
          )}
        </DateInput>
        <AriaButton className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-text-muted outline-none transition-all duration-200 hover:bg-brand-100 hover:text-brand-900 active:scale-90 data-[focus-visible]:ring-2 data-[focus-visible]:ring-brand-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </AriaButton>
      </Group>

      <Popover
        placement="bottom start"
        offset={8}
        className="z-[60] rounded-card border border-border-subtle bg-surface-card p-3 shadow-card outline-none"
      >
        <Calendar className="text-text-primary">
          <header className="mb-2 flex items-center justify-between px-1">
            <AriaButton
              slot="previous"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-text-muted outline-none transition-all duration-200 hover:bg-brand-100 hover:text-brand-900 active:scale-90"
            >
              ‹
            </AriaButton>
            <Heading className="text-sm font-semibold" />
            <AriaButton
              slot="next"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-text-muted outline-none transition-all duration-200 hover:bg-brand-100 hover:text-brand-900 active:scale-90"
            >
              ›
            </AriaButton>
          </header>
          <CalendarGrid className="border-separate border-spacing-1">
            {(date) => (
              <CalendarCell
                date={date}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm outline-none transition hover:bg-brand-100 data-[selected]:bg-brand-900 data-[selected]:text-text-inverse data-[outside-month]:text-text-muted/40 data-[disabled]:opacity-40"
              />
            )}
          </CalendarGrid>
        </Calendar>
      </Popover>
    </AriaDatePicker>
  );
}

export const todayStr = () => today(getLocalTimeZone()).toString();
