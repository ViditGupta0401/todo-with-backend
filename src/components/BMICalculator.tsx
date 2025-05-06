import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

interface BMIData {
  date: string;
  weight: number;
  height: number;
  bmi: number;
}

interface BMICalculatorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const BMI_DATA_KEY = 'bmi-tracker-data';

export const BMICalculator: React.FC<BMICalculatorProps> = ({ selectedMonth, onMonthChange }) => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmiData, setBmiData] = useState<BMIData[]>(() => {
    const savedData = localStorage.getItem(BMI_DATA_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error loading BMI data from localStorage:', error);
        return [];
      }
    }
    return [];
  });
  const [bmi, setBmi] = useState<number | null>(null);

  // Define calculateBMI function with useCallback
  const calculateBMI = useCallback(() => {
    if (!height || !weight) {
      setBmi(null);
      return;
    }

    // Parse height input in format "ft'in"
    const heightParts = height.split("'");
    const feet = parseFloat(heightParts[0] || '0');
    const inches = parseFloat(heightParts[1] || '0');
    
    // Convert height to meters
    const heightInFeet = feet + (inches / 12);
    const heightInMeters = heightInFeet * 0.3048;

    // Convert weight to kg
    const weightInKg = parseFloat(weight);

    if (isNaN(heightInMeters) || isNaN(weightInKg) || heightInMeters <= 0 || weightInKg <= 0) {
      setBmi(null);
      return;
    }

    // Calculate BMI
    const calculatedBMI = weightInKg / (heightInMeters * heightInMeters);
    setBmi(parseFloat(calculatedBMI.toFixed(1)));
  }, [height, weight]);

  // Calculate healthy weight range based on height
  const calculateHealthyWeightRange = useCallback(() => {
    if (!height) return null;
    
    // Parse height input in format "ft'in"
    const heightParts = height.split("'");
    const feet = parseFloat(heightParts[0] || '0');
    const inches = parseFloat(heightParts[1] || '0');
    
    // Convert height to meters
    const heightInFeet = feet + (inches / 12);
    const heightInMeters = heightInFeet * 0.3048;
    
    if (isNaN(heightInMeters) || heightInMeters <= 0) return null;
    
    // Calculate weight range for BMI 18.5-24.9
    const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
    const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);
    
    return { minWeight, maxWeight };
  }, [height]);

  // Calculate BMI whenever height or weight changes
  useEffect(() => {
    calculateBMI();
  }, [calculateBMI]);

  // Save BMI data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(BMI_DATA_KEY, JSON.stringify(bmiData));
    } catch (error) {
      console.error('Error saving BMI data to localStorage:', error);
    }
  }, [bmiData]);

  const saveBMIData = () => {
    if (bmi === null) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const newData: BMIData = {
      date: todayStr,
      weight: parseFloat(weight),
      height: parseFloat(height.split("'")[0] || '0') + (parseFloat(height.split("'")[1] || '0') / 12),
      bmi
    };

    // Update data or add new entry
    const existingIndex = bmiData.findIndex(d => d.date === todayStr);
    if (existingIndex >= 0) {
      setBmiData(prevData => {
        const updatedData = [...prevData];
        updatedData[existingIndex] = newData;
        return updatedData;
      });
    } else {
      setBmiData(prevData => [...prevData, newData]);
    }

    // Display alert
    alert('BMI data saved for today!');
  };

  // Navigate to previous month
  const prevMonth = () => {
    const prev = new Date(selectedMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  // Navigate to next month
  const nextMonth = () => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  // Function to determine BMI category color
  const getBMIColor = (bmiValue: number | null) => {
    if (bmiValue === null) return 'bg-gray-200';
    if (bmiValue < 18.5) return 'bg-blue-400'; // Underweight
    if (bmiValue < 25) return 'bg-green-400'; // Normal weight
    if (bmiValue < 30) return 'bg-orange-400'; // Overweight
    return 'bg-red-400'; // Obese
  };

  // Function to determine BMI category text
  const getBMICategory = (bmiValue: number | null) => {
    if (bmiValue === null) return 'Healthy BMI range: 18.5 - 24.9';
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal weight';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  // Calculate BMI dial angle (from 0 to 180 degrees)
  const getBmiDialAngle = () => {
    if (bmi === null) return 90; // Default position at center
    
    // BMI value ranges typically from ~15 to ~40
    // Map BMI range to angle range (180° to 0°)
    // BMI 15 or below = 180°, BMI 90 or above = 0°
    
    const minBmi = 15; // Minimum BMI (will point to 180°/left)
    const maxBmi = 90; // Maximum BMI (will point to 0°/right)
    const range = maxBmi - minBmi;
    
    // Linear mapping from BMI to angle
    const angle = 180 - ((bmi - minBmi) / range) * 180;
    
    // Clamp between 0 and 180 degrees
    return Math.min(180, Math.max(0, angle));
  };
  
  const dialAngle = getBmiDialAngle();
  const healthyWeightRange = calculateHealthyWeightRange();

  return (
    <div className="bg-white dark:bg-[#222126] p-4 rounded-xl shadow-lg">
      <h2 className="text-lg sm:text-xl font-normal mb-4 text-gray-800 dark:text-zinc-200">BMI Calculator</h2>
      
      <div className="flex flex-col gap-4">
        {/* BMI Meter */}
        <div className=" h-fit mb-10 ">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">BMI meter</label>
          <div className="relative  h-40 w-full">
            {/* BMI Dial Background */}
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Gradient definition */}
              <defs>
                <linearGradient id="bmiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" /> {/* Blue */}
                  <stop offset="50%" stopColor="#22c55e" /> {/* Green */}
                  <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
                </linearGradient>
              </defs>
              
              {/* Semicircle background with gradient */}
              <path 
                d="M25,100 A75,75 0 0,1 175,100" 
                fill="none" 
                stroke="url(#bmiGradient)" 
                strokeWidth="10" 
                strokeLinecap="round"
              />
              
              {/* Blue indicator circle */}
              <g>
                <circle 
                  cx={(() => {
                    if (bmi === null) return 100; // Center position when no value
                    
                    // Map BMI value to x-position on the arc
                    // Clamping BMI to minimum of 10 for display purposes
                    const displayBmi = Math.max(10, bmi);
                    const minBmi = 10; // Minimum BMI that will be shown on the left edge
                    const maxBmi = 40; // Maximum BMI that will be shown on the right edge
                    const range = maxBmi - minBmi;
                    
                    // Calculate position along the arc (0 to 150)
                    const position = ((displayBmi - minBmi) / range) * 150;
                    
                    // Map position to x coordinate (25 to 175)
                    return 25 + position;
                  })()}
                  cy={(() => {
                    if (bmi === null) return 100;
                    
                    // Calculate y-position based on the circle equation
                    // Clamping BMI to minimum of 10 for display purposes
                    const displayBmi = Math.max(10, bmi);
                    
                    const x = (() => {
                      const minBmi = 10;
                      const maxBmi = 40;
                      const range = maxBmi - minBmi;
                      const position = ((displayBmi - minBmi) / range) * 150;
                      return 25 + position;
                    })();
                    
                    // Calculate y value on semicircle
                    // Semicircle equation: y = k - √(r² - (x-h)²)
                    // Where (h,k) is center (100,100) and r is 75
                    const h = 100;
                    const k = 100;
                    const r = 75;
                    
                    return k - Math.sqrt(Math.max(0, r*r - Math.pow(x-h, 2)));
                  })()}
                  r="8"
                  fill="#2870f0"
                  style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.3))' }}
                />
              </g>
              
              {/* BMI Value */}
              <text x="100" y="85" fontSize="14" textAnchor="middle" fill="#6B7280" className="dark:fill-gray-300">
                Your BMI
              </text>
              
              <text x="100" y="110" fontSize="28" fontWeight="bold" textAnchor="middle" fill="#1f2937" className="dark:fill-white">
                {bmi !== null ? bmi : ''}
              </text>
            </svg>
            
            {/* BMI Category Label */}
            <div className="absolute  left-0 w-full flex justify-center">
              <div 
                className={`px-4 py-1.5 rounded-full font-medium text-white ${
                  bmi === null ? 'bg-transparent' : 
                  bmi < 18.5 ? 'bg-blue-500' :
                  bmi < 25 ? 'bg-green-500' :
                  bmi < 30 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
              >
                {getBMICategory(bmi)}
              </div>
            </div>
          </div>
        </div>

        {/* Height */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Height</label>
            <input
              type="text"
              placeholder="e.g., 5'8"
              value={height}
              onChange={(e) => {
                const input = e.target.value;
                // Remove any non-numeric characters
                const numbersOnly = input.replace(/[^0-9]/g, '');
                
                if (numbersOnly.length >= 2) {
                  // Format as feet'inches by inserting an apostrophe after the first digit
                  const feet = numbersOnly.slice(0, 1);
                  const inches = numbersOnly.slice(1);
                  setHeight(`${feet}'${inches}`);
                } else {
                  // Just set the number if it's a single digit
                  setHeight(numbersOnly);
                }
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!height) return;

                // Parse current height
                const parts = height.split("'");
                let feet = parseInt(parts[0] || '0');
                let inches = parseInt(parts[1] || '0');

                // Increment or decrement based on scroll direction
                if (e.deltaY < 0) {
                  // Scrolling up - increase
                  inches += 1;
                  if (inches >= 12) {
                    feet += 1;
                    inches = 0;
                  }
                } else {
                  // Scrolling down - decrease
                  inches -= 1;
                  if (inches < 0) {
                    feet = Math.max(1, feet - 1); // Don't go below 1 foot
                    inches = 11;
                  }
                }

                setHeight(`${feet}'${inches}`);
              }}
              className="w-28 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#18181c] px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Weight */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Weight</label>
            <input
              type="number"
              placeholder="kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!weight) return;
                
                // Parse current weight
                const weightValue = parseFloat(weight);
                if (isNaN(weightValue)) return;
                
                // Increment or decrement based on scroll direction
                if (e.deltaY < 0) {
                  // Scrolling up - increase by 1
                  setWeight((weightValue + 1).toString());
                } else {
                  // Scrolling down - decrease by 1, but don't go below 1
                  setWeight(Math.max(1, weightValue - 1).toString());
                }
              }}
              className="w-28 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#18181c] px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        
        {/* Healthy Weight Information */}
        {bmi !== null && (
          <div className={`p-3 rounded-lg border mt-4 ${
            bmi < 18.5 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30" :
            bmi >= 18.5 && bmi < 25 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30" :
            "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30"
          }`}>
            {bmi >= 18.5 && bmi < 25 ? (
              <p className="text-green-800 dark:text-green-300 font-medium mb-1">You're in a healthy BMI range- great job!</p>
            ) : (
              <p className={`font-medium mb-1 ${
                bmi < 18.5 ? "text-red-800 dark:text-red-300" : "text-orange-800 dark:text-orange-300"
              }`}>
                {bmi < 18.5 ? "Your BMI indicates you're underweight." : "Your BMI indicates you're overweight."}
              </p>
            )}
            {healthyWeightRange && (
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Healthy weight as per your details: {healthyWeightRange.minWeight} kg - {healthyWeightRange.maxWeight} kg
              
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};