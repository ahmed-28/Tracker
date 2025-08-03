interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export default function Stepper({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  disabled = false 
}: StepperProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const formatValue = (val: number) => {
    return step < 1 ? val.toFixed(1) : val.toString();
  };

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        aria-label="Decrease value"
      >
        −
      </button>
      
      <input
        type="number"
        className="form-input stepper-input"
        value={formatValue(value)}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      
      <button
        type="button"
        className="stepper-btn"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}