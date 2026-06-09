import { NumberInput } from './NumberInput';
import type { PanShape } from '../lib/types';

type PanFieldsProps = {
  pan?: PanShape;
  onChange: (pan: PanShape) => void;
};

const defaultRoundPan: PanShape = { type: 'round', diameterCm: 24 };
const defaultRectangularPan: PanShape = { type: 'rectangular', widthCm: 24, heightCm: 24 };

export function PanFields({ pan, onChange }: PanFieldsProps) {
  const currentPan = pan ?? defaultRoundPan;

  function setType(type: PanShape['type']) {
    onChange(type === 'round' ? defaultRoundPan : defaultRectangularPan);
  }

  return (
    <div className="panFields">
      <div className="segmentedControl" aria-label="Typ foremki">
        <button
          className={currentPan.type === 'round' ? 'active' : ''}
          type="button"
          onClick={() => setType('round')}
        >
          Okrągła
        </button>
        <button
          className={currentPan.type === 'rectangular' ? 'active' : ''}
          type="button"
          onClick={() => setType('rectangular')}
        >
          Prostokątna
        </button>
      </div>

      {currentPan.type === 'round' ? (
        <NumberInput
          label="Średnica"
          value={currentPan.diameterCm}
          step="0.1"
          suffix="cm"
          onValueChange={(diameterCm) => onChange({ type: 'round', diameterCm })}
        />
      ) : (
        <div className="twoColumn">
          <NumberInput
            label="Szerokość"
            value={currentPan.widthCm}
            step="0.1"
            suffix="cm"
            onValueChange={(widthCm) => onChange({ ...currentPan, widthCm })}
          />
          <NumberInput
            label="Długość"
            value={currentPan.heightCm}
            step="0.1"
            suffix="cm"
            onValueChange={(heightCm) => onChange({ ...currentPan, heightCm })}
          />
        </div>
      )}
    </div>
  );
}
