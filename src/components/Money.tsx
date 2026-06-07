import { formatMoney } from '../lib/format';

type MoneyProps = {
  value: number;
  rounded?: boolean;
  className?: string;
};

export function Money({ value, rounded, className }: MoneyProps) {
  void rounded;
  return <span className={className}>{formatMoney(value)}</span>;
}
