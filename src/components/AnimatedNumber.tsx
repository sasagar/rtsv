import { useState, useEffect } from 'react';

/**
 * Props for the AnimatedNumber component.
 * @interface
 */
interface AnimatedNumberProps {
  value: number;
}

/**
 * A component that animates a number change with a simple count-up/down effect.
 * @param {AnimatedNumberProps} props - The component props.
 * @param {number} props.value - The target value to animate to.
 * @returns {JSX.Element} The rendered component displaying the animated number.
 */
const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    const animation = () => {
      setCurrentValue(prevValue => {
        if (prevValue < value) {
          return Math.min(prevValue + Math.ceil((value - prevValue) / 10), value);
        } else if (prevValue > value) {
          return Math.max(prevValue - Math.ceil((prevValue - value) / 10), value);
        } else {
          return value;
        }
      });
    };

    const interval = setInterval(() => {
      animation();
    }, 50);

    return () => clearInterval(interval);
  }, [value]);

  return <span>{currentValue}</span>;
};

export default AnimatedNumber;