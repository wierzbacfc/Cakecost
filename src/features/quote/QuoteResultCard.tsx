import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Money } from '../../components/Money';
import { getActiveLaborMinutes, roundCurrency } from '../../lib/calculations';
import type { QuoteInput, QuoteResult, Recipe } from '../../lib/types';

type QuoteResultCardProps = {
  recipe: Recipe;
  input: QuoteInput;
  result: QuoteResult;
  customerPrice: number;
};

export function QuoteResultCard({
  recipe,
  input,
  result,
  customerPrice
}: QuoteResultCardProps) {
  const activeHours = getActiveLaborMinutes(recipe) / 60;
  const lowProfit = result.profitValue < result.totalCost * 0.2;
  const hasCustomerPrice = customerPrice > 0;
  const customerProfit = hasCustomerPrice ? roundCurrency(customerPrice - result.totalCost) : undefined;
  const customerHourlyProfit =
    customerProfit !== undefined && activeHours > 0
      ? roundCurrency(customerProfit / activeHours)
      : undefined;
  const customerBelowCost = hasCustomerPrice && customerPrice < result.totalCost;

  return (
    <section className="resultPanel" aria-live="polite">
      <div className="resultHeader">
        <div>
          <p className="eyebrow">{recipe.name}</p>
          <h2>Cena sugerowana</h2>
        </div>
        <strong className="resultPrice">
          <Money value={result.suggestedPrice} rounded />
        </strong>
      </div>

      <div className="resultBreakdown">
        <CostRow label="Koszt składników" value={result.ingredientsCost} />
        <CostRow label="Opakowanie" value={result.packagingCost} />
        <CostRow label="Dodatki" value={result.extrasCost} />
        <CostRow label="Energia" value={result.energyCost} />
        <CostRow label="Dowóz" value={result.deliveryCost} />
        <CostRow label="Praca" value={result.laborCost} />
        <CostRow label="Koszt bazowy" value={result.baseCost} emphasized />
        <CostRow
          label={`Dodatkowe koszty (${input.safetyMarginPercent}%)`}
          value={result.safetyMarginValue}
        />
        <CostRow label="Łączny koszt" value={result.totalCost} emphasized />
        <CostRow label="Zysk" value={result.profitValue} />
        <CostRow label="Cena dokładna" value={result.exactPrice} />
      </div>

      <div className="formulaBox">
        <p>
          Koszt bazowy = składniki + opakowanie + dodatki + energia + dowóz + praca.
          Cena sugerowana = cena dokładna zaokrąglona w górę do {input.roundTo} zł.
        </p>
      </div>

      <div className="metricGrid">
        {result.pricePerServing !== undefined ? (
          <div className="metricTile">
            <span>Cena za porcję</span>
            <strong>
              <Money value={result.pricePerServing} />
            </strong>
          </div>
        ) : null}
        {result.pricePerKg !== undefined ? (
          <div className="metricTile">
            <span>Cena za kg</span>
            <strong>
              <Money value={result.pricePerKg} />
            </strong>
          </div>
        ) : null}
        {result.effectiveHourlyProfit !== undefined ? (
          <div className="metricTile">
            <span>Zysk za godzinę pracy</span>
            <strong>
              <Money value={result.effectiveHourlyProfit} />/h
            </strong>
          </div>
        ) : null}
      </div>

      {lowProfit ? (
        <div className="warning warningSoft">
          <AlertTriangle size={20} />
          <span>Zysk jest niższy niż 20% łącznego kosztu.</span>
        </div>
      ) : (
        <div className="warning warningGood">
          <CheckCircle2 size={20} />
          <span>Zysk przekracza 20% łącznego kosztu.</span>
        </div>
      )}

      {hasCustomerPrice ? (
        <div className={customerBelowCost ? 'warning warningDanger' : 'customPriceBox'}>
          {customerBelowCost ? <AlertTriangle size={20} /> : null}
          <div>
            <strong>
              Przy tej cenie zarobisz:{' '}
              {customerProfit !== undefined ? <Money value={customerProfit} /> : '—'}
            </strong>
            {customerHourlyProfit !== undefined ? (
              <span>
                Efektywny zysk za godzinę pracy: <Money value={customerHourlyProfit} />/h
              </span>
            ) : null}
            {customerBelowCost ? (
              <span>Cena klienta jest niższa od łącznego kosztu wykonania.</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CostRow({
  label,
  value,
  emphasized
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className={emphasized ? 'costRow emphasized' : 'costRow'}>
      <span>{label}</span>
      <strong>
        <Money value={value} />
      </strong>
    </div>
  );
}
