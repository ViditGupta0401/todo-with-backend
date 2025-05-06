import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, addMonths, subMonths, isToday } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faBullseye } from '@fortawesome/free-solid-svg-icons';

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
const BMI_HEIGHT_KEY = 'bmi-last-height'; // New constant for height storage

export const BMICalculator: React.FC<BMICalculatorProps> = ({ selectedMonth, onMonthChange }) => {
  const [height, setHeight] = useState<string>(() => {
    // Load the last saved height from localStorage
    const savedHeight = localStorage.getItem(BMI_HEIGHT_KEY);
    return savedHeight || '';
  });
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
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState('');

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

  // Auto-save BMI data when valid values are available
  useEffect(() => {
    // Check if we have valid BMI data to save
    if (bmi !== null && height && weight) {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Create BMI data object
      const newData: BMIData = {
        date: todayStr,
        weight: parseFloat(weight),
        height: parseFloat(height.split("'")[0] || '0') + (parseFloat(height.split("'")[1] || '0') / 12),
        bmi
      };
      
      // Check if we already have data for today
      const existingIndex = bmiData.findIndex(d => d.date === todayStr);
      
      // Update or add today's data
      if (existingIndex >= 0) {
        // Only update if data has changed
        const existingData = bmiData[existingIndex];
        if (existingData.bmi !== bmi || existingData.weight !== parseFloat(weight)) {
          setBmiData(prevData => {
            const updatedData = [...prevData];
            updatedData[existingIndex] = newData;
            return updatedData;
          });
          console.log('Auto-updated today\'s BMI data:', newData);
        }
      } else {
        // Add new entry for today
        setBmiData(prevData => [...prevData, newData]);
        console.log('Auto-saved new BMI data for today:', newData);
      }
    }
  }, [bmi, height, weight, bmiData]);

  // Save BMI data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(BMI_DATA_KEY, JSON.stringify(bmiData));
    } catch (error) {
      console.error('Error saving BMI data to localStorage:', error);
    }
  }, [bmiData]);

  // Save height to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(BMI_HEIGHT_KEY, height);
    } catch (error) {
      console.error('Error saving height to localStorage:', error);
    }
  }, [height]);

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
    if (bmiValue === null) return 'text-gray-400 dark:text-gray-600';
    if (bmiValue < 18.5) return 'text-blue-500';
    if (bmiValue < 25) return 'text-green-500';
    if (bmiValue < 30) return 'text-orange-500';
    return 'text-red-500';
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

  // Process BMI data for the month graph
  const monthlyBMIData = useMemo(() => {
    // Get the start and end of the selected month
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create a map of date strings to BMI data
    const dataMap: { [date: string]: BMIData } = {};
    bmiData.forEach(data => {
      dataMap[data.date] = data;
    });
    
    // Initialize an array with days and corresponding BMI data
    const monthData = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dataMap[dateStr];
      return {
        date: dateStr,
        day: parseInt(format(day, 'd')),
        bmiValue: dayData?.bmi || null,
        weight: dayData?.weight || null
      };
    });
    
    return monthData;
  }, [bmiData, selectedMonth]);

  // Find min and max BMI values for the graph scaling
  const { minBMI, maxBMI, hasData, targetWeight } = useMemo(() => {
    const bmiValues = monthlyBMIData
      .filter(d => d.bmiValue !== null)
      .map(d => d.bmiValue as number);
    
    const weightValues = monthlyBMIData
      .filter(d => d.weight !== null)
      .map(d => d.weight as number);
    
    // Get monthly target weight if it exists
    let targetWeightValue = null;
    try {
      const targetWeightData = localStorage.getItem('weight-monthly-target');
      if (targetWeightData) {
        const parsed = JSON.parse(targetWeightData);
        const currentMonthStr = format(selectedMonth, 'yyyy-MM');
        if (parsed.month === currentMonthStr) {
          targetWeightValue = parsed.target;
        }
      }
    } catch (error) {
      console.error('Error reading target data:', error);
    }
    
    if (bmiValues.length === 0) {
      return { 
        minBMI: 15, 
        maxBMI: 35, 
        hasData: false,
        targetWeight: targetWeightValue 
      };
    }
    
    // Add a small buffer to the min/max for better visualization
    const min = Math.max(10, Math.floor(Math.min(...bmiValues)) - 1);
    const max = Math.min(40, Math.ceil(Math.max(...bmiValues)) + 1);
    
    return { 
      minBMI: min, 
      maxBMI: max, 
      hasData: true,
      targetWeight: targetWeightValue
    };
  }, [monthlyBMIData, selectedMonth]);

  // Calculate BMI chart height for a specific value
  const getBMIPointPosition = (bmiValue: number | null) => {
    if (bmiValue === null) return null;
    
    // Calculate percentage within the minBMI to maxBMI range
    const range = maxBMI - minBMI;
    const percentage = Math.min(100, Math.max(0, ((bmiValue - minBMI) / range) * 100));
    
    // Convert to position from bottom (0% is bottom, 100% is top)
    return `${percentage}%`;
  };

  return (
    <div className="bg-white dark:bg-[#222126] p-4 rounded-xl shadow-lg">
      
      
      <div className="flex flex-col gap-4">
        {/* BMI Meter */}
        <div className=" h-fit mb-10 ">
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
              className="w-28 h-10 rounded-3xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#18181c] px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              className="w-28 h-10 rounded-3xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#18181c] px-3 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        
        {/* Month Graph */}
        <div className="mt-4  mb-4">
          <div className="flex items-center  justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-2">
              BMI Trends: {format(selectedMonth, 'MMMM yyyy')}
              <button 
                onClick={() => {
                  // Initialize target weight input with current target if it exists
                  setTargetWeightInput(targetWeight ? targetWeight.toString() : '');
                  setShowTargetModal(true);
                }}
                className="p-1 text-pink-500 hover:text-pink-600 transition-colors"
                title="Set target weight for this month"
              >
                <FontAwesomeIcon icon={faBullseye} className="h-3.5 w-3.5" />
              </button>
            </h3>
            <div className="flex  space-x-2">
              <button 
                onClick={prevMonth} 
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Previous month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextMonth} 
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Next month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800  rounded-xl p-3 overflow-hidden">
            {hasData ? (
              <div className="relative h-36">
                {/* Horizontal lines for BMI ranges */}
                <div className="absolute left-0 right-0 h-px bg-red-200 dark:bg-red-700/30" style={{ bottom: `${((30 - minBMI) / (maxBMI - minBMI)) * 100}%` }}>
                  <span className="absolute -top-6 -right-1 text-xs text-red-500">Obese (30+)</span>
                </div>
                <div className="absolute left-0 right-0 h-px bg-orange-200 dark:bg-orange-700/30" style={{ bottom: `${((25 - minBMI) / (maxBMI - minBMI)) * 100}%` }}>
                  <span className="absolute -top-6 -right-1 text-xs text-orange-500">Overweight (25+)</span>
                </div>
                <div className="absolute left-0 right-0 h-px bg-green-200 dark:bg-green-700/30" style={{ bottom: `${((18.5 - minBMI) / (maxBMI - minBMI)) * 100}%` }}>
                  <span className="absolute -top-6 -right-1 text-xs text-green-500">Normal</span>
                </div>
                
                {/* Line chart */}
                <div className="absolute inset-0">
                  {/* X-axis day labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                    {monthlyBMIData.map((day, index) => (
                      day.day % 5 === 0 ? (
                        <span 
                          key={`label-${day.date}`}
                          className="text-[8px] text-gray-500"
                          style={{ width: `${100 / monthlyBMIData.length}%`, textAlign: 'center' }}
                        >
                          {day.day}
                        </span>
                      ) : <span key={`label-${day.date}`} style={{ width: `${100 / monthlyBMIData.length}%` }}></span>
                    ))}
                  </div>
                  
                  {/* SVG for line chart */}
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    {/* Gradient definition for line */}
                    <defs>
                      <linearGradient id="bmiLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue for underweight */}
                        <stop offset="20%" stopColor="#22c55e" /> {/* Green for normal */}
                        <stop offset="80%" stopColor="#22c55e" /> {/* Green for normal */}
                        <stop offset="100%" stopColor="#ff5151" /> {/* Red for overweight */}
                      </linearGradient>
                    </defs>
                    
                    {/* Lines connecting sequential data points - using weight-based positioning */}
                    {monthlyBMIData
                      .reduce((segments, day, index, array) => {
                        // Skip if this point has no weight data
                        if (day.weight === null) return segments;
                        
                        // Skip if this is the last point
                        if (index === array.length - 1) return segments;
                        
                        // Find the next point with data
                        let nextPointIndex = -1;
                        for (let i = index + 1; i < array.length; i++) {
                          if (array[i].weight !== null) {
                            nextPointIndex = i;
                            break;
                          }
                        }
                        
                        // If no next point found, skip
                        if (nextPointIndex === -1) return segments;
                        
                        const nextPoint = array[nextPointIndex];
                        
                        // Get weight range for the graph
                        const today = new Date();
                        const todayStr = format(today, 'yyyy-MM-dd');
                        const currentWeightData = bmiData.find(d => d.date === todayStr);
                        const weights = monthlyBMIData
                          .filter(d => d.weight !== null)
                          .map(d => d.weight as number);
                        const currentWeight = currentWeightData?.weight || weights[weights.length - 1];
                        const minWeight = Math.floor(currentWeight - 5);
                        const maxWeight = minWeight + 10; // Exactly 10kg range
                        
                        // Calculate coordinates for this point based on weight
                        const x1 = (index / (array.length - 1)) * 100;
                        const weightPosition1 = ((day.weight - minWeight) / 10) * 100;
                        const y1 = 100 - Math.min(98, Math.max(2, weightPosition1));
                        
                        // Calculate coordinates for next point based on weight
                        const x2 = (nextPointIndex / (array.length - 1)) * 100;
                        const weightPosition2 = ((nextPoint.weight - minWeight) / 10) * 100;
                        const y2 = 100 - Math.min(98, Math.max(2, weightPosition2));
                        
                        // Add the line segment
                        segments.push({
                          x1: `${x1}%`,
                          y1: `${y1}%`,
                          x2: `${x2}%`,
                          y2: `${y2}%`,
                          avgBMI: (day.bmiValue! + nextPoint.bmiValue!) / 2
                        });
                        
                        return segments;
                      }, [] as Array<{
                        x1: string;
                        y1: string;
                        x2: string;
                        y2: string;
                        avgBMI: number;
                      }>)
                      .map((segment, i) => (
                        <line
                          key={`line-${i}`}
                          x1={segment.x1}
                          y1={segment.y1}
                          x2={segment.x2}
                          y2={segment.y2}
                          stroke={
                            segment.avgBMI < 18.5 ? "#3b82f6" :  // Blue for underweight
                            segment.avgBMI < 25 ? "#22c55e" :    // Green for normal
                            "#ff5151"                            // Red for overweight/obese
                          }
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      ))
                    }
                    
                    {/* Data points with BMI-based color but weight-based positioning */}
                    {monthlyBMIData.map((day, index) => {
                      if (day.weight === null) return null;
                      
                      const x = (index / (monthlyBMIData.length - 1)) * 100;
                      
                      // Get weight range for the graph
                      const today = new Date();
                      const todayStr = format(today, 'yyyy-MM-dd');
                      const currentWeightData = bmiData.find(d => d.date === todayStr);
                      const weights = monthlyBMIData
                        .filter(d => d.weight !== null)
                        .map(d => d.weight as number);
                      const currentWeight = currentWeightData?.weight || weights[weights.length - 1];
                      const minWeight = Math.floor(currentWeight - 5);
                      const maxWeight = minWeight + 10; // Exactly 10kg range
                      
                      // Calculate position based on weight
                      const weightPosition = ((day.weight - minWeight) / 10) * 100; // Using 10kg range
                      const y = 100 - Math.min(98, Math.max(2, weightPosition)); // Clamp y position
                      
                      const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <g key={day.date}>
                          {/* Visible data point - solid circle with BMI-based color */}
                          <circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="4"
                            fill={
                              isToday ? (
                                day.bmiValue < 18.5 ? "#3b82f6" :  // Blue for underweight
                                day.bmiValue < 25 ? "#22c55e" :    // Green for normal
                                "#ff3b3b"                          // Red for overweight/obese
                              ) : (
                                day.bmiValue < 18.5 ? "#60a5fa" :  // Lighter blue for underweight
                                day.bmiValue < 25 ? "#22c55e" :    // Green for normal 
                                "#ff6b35"                          // Orange for overweight/obese
                              )
                            }
                          />
                          
                          {/* Larger invisible circle for better hover detection */}
                          <circle
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="10"
                            fill="transparent"
                            className="cursor-pointer"
                          >
                            <title>
                              Date: {format(new Date(day.date), 'MMM d, yyyy')}
                              {isToday ? " (Today)" : ""}
                              {'\n'}BMI: {day.bmiValue}
                              {'\n'}Weight: {day.weight} kg
                            </title>
                          </circle>
                        </g>
                      );
                    })}
                    
                    {/* Target Weight line if set */}
                    {targetWeight !== null && monthlyBMIData.some(d => d.weight !== null) && (
                      <>
                        {/* Calculate position for target weight based on existing weight data */}
                        {(() => {
                          // Get weights from the data
                          const weights = monthlyBMIData
                            .filter(d => d.weight !== null)
                            .map(d => d.weight as number);
                          
                          if (weights.length === 0) return null;
                          
                          // Find current weight (most recent entry)
                          const today = new Date();
                          const todayStr = format(today, 'yyyy-MM-dd');
                          const currentWeightData = bmiData.find(d => d.date === todayStr);
                          const currentWeight = currentWeightData?.weight || weights[weights.length - 1];
                          
                          // Set a fixed 10kg range centered around current weight (±5kg)
                          const minWeight = Math.floor(currentWeight - 5);
                          const maxWeight = minWeight + 10; // Exactly 10kg range
                          
                          // Calculate position as percentage (0-100)
                          const position = ((targetWeight - minWeight) / 10) * 100; // 10kg fixed range
                          const yPos = 100 - Math.min(95, Math.max(5, position)); // Adjusted clamping to avoid edge cutoff
                          
                          return (
                            <>
                              {/* Only show min and max weight values, with better positioning to avoid edge cutoff */}
                              <text
                                x="1%"
                                y="5%"
                                fontSize="10"
                                textAnchor="start"
                                fill="#6B7280"
                                className="dark:fill-gray-400"
                              >
                                {maxWeight} kg
                              </text>
                              
                              <text
                                x="1%"
                                y="95%"
                                fontSize="10"
                                textAnchor="start"
                                fill="#6B7280"
                                className="dark:fill-gray-400"
                              >
                                {minWeight} kg
                              </text>
                              
                              {/* Target weight line */}
                              <line
                                x1="0%"
                                y1={`${yPos}%`}
                                x2="100%"
                                y2={`${yPos}%`}
                                stroke="#ec4899" // Pink color
                                strokeWidth="1.5"
                                strokeDasharray="4,2"
                              />
                              
                              {/* Target weight label with improved positioning */}
                              <text
                                x="99%"
                                y={`${yPos - 5}%`}
                                fontSize="10"
                                textAnchor="end"
                                fill="#ec4899"
                                className="dark:fill-orange-400"
                              >
                               {targetWeight} kg
                              </text>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">No BMI data for this month</p>
              </div>
            )}
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
        
        {/* Target Weight Modal */}
        {showTargetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTargetModal(false)}>
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-xl max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faBullseye} className="text-pink-500 h-4 w-4" />
                Set Target Weight
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Target Weight for {format(selectedMonth, 'MMMM yyyy')}
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#18181c]"
                  placeholder="Enter weight in kg"
                  value={targetWeightInput}
                  onChange={(e) => setTargetWeightInput(e.target.value)}
                  min="1"
                  step="0.1"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button 
                  className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setShowTargetModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                  onClick={() => {
                    const targetWeightValue = parseFloat(targetWeightInput);
                    if (targetWeightInput && !isNaN(targetWeightValue)) {
                      localStorage.setItem('weight-monthly-target', JSON.stringify({
                        month: format(selectedMonth, 'yyyy-MM'),
                        target: targetWeightValue
                      }));
                      // Force re-render to show the target line
                      setBmiData([...bmiData]);
                      setShowTargetModal(false);
                    }
                  }}
                >
                  Save Target
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};