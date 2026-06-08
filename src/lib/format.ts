import type { Unit } from './types';

const moneyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const decimalFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 5
});

const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function formatMoney(value: number) {
  return moneyFormatter.format(roundWholeZloty(value));
}

export function formatDecimal(value: number, maxDigits = 5) {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits
  }).format(value);
}

export function formatUnitPrice(unitPrice: number, unit: Unit) {
  const baseUnit =
    unit === 'kg' || unit === 'g' ? 'g' : unit === 'l' || unit === 'ml' ? 'ml' : 'szt.';

  if (unitPrice > 0 && unitPrice < 1) {
    return `< 1 zł/${baseUnit}`;
  }

  return `${decimalFormatter.format(roundWholeZloty(unitPrice))} zł/${baseUnit}`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function formatAmount(amount: number, unit: Unit) {
  return `${formatDecimal(amount)} ${unit}`;
}

function roundWholeZloty(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return 0;
  }

  return value > 0
    ? Math.ceil(value - Number.EPSILON)
    : Math.floor(value + Number.EPSILON);
}
