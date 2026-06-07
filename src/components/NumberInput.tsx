import {
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState
} from 'react';

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'min' | 'max'
> & {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  error?: string;
};

export function NumberInput({
  label,
  value,
  onValueChange,
  min = 0,
  max,
  suffix,
  error,
  id,
  step = '1',
  ...inputProps
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(toInputValue(value));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(toInputValue(value));
    }
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (nextDraft.trim() === '') {
      return;
    }

    const parsed = Number(nextDraft.replace(',', '.'));

    if (!Number.isFinite(parsed)) {
      return;
    }

    onValueChange(normalizeNumber(parsed, min, max, step));
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    inputProps.onBlur?.(event);

    if (draft.trim() === '') {
      onValueChange(min);
      setDraft(toInputValue(min));
      return;
    }

    const parsed = Number(draft.replace(',', '.'));
    const normalized = Number.isFinite(parsed) ? normalizeNumber(parsed, min, max, step) : min;
    onValueChange(normalized);
    setDraft(toInputValue(normalized));
  }

  return (
    <label className="field" htmlFor={inputId}>
      <span className="fieldLabel">{label}</span>
      <span className="inputShell">
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="number"
          inputMode="decimal"
          value={draft}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {suffix ? <span className="inputSuffix">{suffix}</span> : null}
      </span>
      {error ? <span className="fieldError">{error}</span> : null}
    </label>
  );
}

function clamp(value: number, min: number, max?: number) {
  const clampedMin = Math.max(value, min);
  return typeof max === 'number' ? Math.min(clampedMin, max) : clampedMin;
}

function normalizeNumber(
  value: number,
  min: number,
  max: number | undefined,
  step: string | number
) {
  const clamped = clamp(value, min, max);
  return step === '1' || step === 1 ? Math.round(clamped) : clamped;
}

function toInputValue(value: number) {
  return Number.isFinite(value) ? String(value) : '0';
}
