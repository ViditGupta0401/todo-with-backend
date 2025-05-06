import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: string;
  className?: string;
  digitClassName?: string;
  separatorClassName?: string;
  separators?: string[];
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className = '',
  digitClassName = '',
  separatorClassName = '',
  separators = [':'],
}) => {
  const [prevValue, setPrevValue] = useState<string>(value);
  const [animatingDigits, setAnimatingDigits] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const digitRefs = useRef<{[key: number]: HTMLSpanElement | null}>({});
  const [digitWidths, setDigitWidths] = useState<{[key: number]: number}>({});
  
  // When component mounts, measure all digit widths
  useEffect(() => {
    const widthsMap: {[key: number]: number} = {};
    
    Object.keys(digitRefs.current).forEach((indexStr) => {
      const index = Number(indexStr);
      const el = digitRefs.current[index];
      if (el) {
        widthsMap[index] = el.getBoundingClientRect().width;
      }
    });
    
    setDigitWidths(widthsMap);
  }, [value]);

  useEffect(() => {
    // Find which digits have changed
    const changedIndexes: number[] = [];
    for (let i = 0; i < value.length; i++) {
      // Only track changes for numeric digits, not separators
      if (i < prevValue.length && !separators.includes(value[i]) && value[i] !== prevValue[i]) {
        changedIndexes.push(i);
      }
    }

    if (changedIndexes.length > 0) {
      // Set which digits are animating
      setAnimatingDigits(changedIndexes);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout to update prevValue after animation completes
      timeoutRef.current = setTimeout(() => {
        setPrevValue(value);
        setAnimatingDigits([]);
      }, 300); // Animation duration
    } else if (value !== prevValue) {
      // If no digits changed but value is different (e.g., length changed)
      setPrevValue(value);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, prevValue, separators]);

  const renderDigit = (digit: string, index: number) => {
    // For separators, return them directly
    if (separators.includes(digit)) {
      return (
        <span 
          key={`sep-${index}`} 
          className={`digit-separator ${separatorClassName}`}
        >
          {digit}
        </span>
      );
    }
    
    // Get width for this digit position
    const width = digitWidths[index] ? `${digitWidths[index]}px` : 'auto';
    
    // If this digit is animating, show animation
    if (animatingDigits.includes(index)) {
      return (
        <span 
          key={`digit-${index}`} 
          className="digit-container"
          style={{ width }}
        >
          {/* Outgoing digit */}
          <span className="digit-exit">
            <span className={`${digitClassName}`}>{prevValue[index]}</span>
          </span>
          
          {/* Incoming digit */}
          <span className="digit-enter">
            <span className={`${digitClassName}`}>{digit}</span>
          </span>
          
          {/* Invisible digit to maintain space */}
          <span style={{ visibility: 'hidden' }}>{digit}</span>
        </span>
      );
    }
    
    // For non-animating digits
    return (
      <span 
        key={`digit-${index}`} 
        className={`digit-static ${digitClassName}`}
        ref={(el) => digitRefs.current[index] = el}
        style={{ width }}
      >
        {digit}
      </span>
    );
  };

  return (
    <div className={`animated-counter ${className}`} style={{ display: 'inline-flex' }}>
      {value.split('').map((digit, index) => renderDigit(digit, index))}
    </div>
  );
};

export default AnimatedCounter;