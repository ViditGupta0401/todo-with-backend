import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalDate, isSameLocalDay } from '../utils/dateUtils';
import { exportData, importData } from '../utils/backup';
import { focusNextElement, focusPreviousElement } from '../utils/accessibility';

describe('Date Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should handle day reset hour correctly', () => {
    const testDate = new Date('2025-07-26T04:59:59');
    const localDate = getLocalDate(testDate);
    expect(localDate.getDate()).toBe(25); // Should be previous day before 5 AM
  });

  it('should compare dates correctly', () => {
    const date1 = new Date('2025-07-26T14:00:00');
    const date2 = new Date('2025-07-26T23:59:59');
    expect(isSameLocalDay(date1, date2)).toBe(true);
  });
});

describe('Backup Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should export and import data correctly', () => {
    // Setup test data
    localStorage.setItem('todo-tracker-tasks', JSON.stringify([{ id: '1', text: 'Test' }]));
    
    const exported = exportData();
    localStorage.clear();
    const imported = importData(exported);
    
    expect(imported).toBe(true);
    expect(localStorage.getItem('todo-tracker-tasks')).toBeTruthy();
  });
});

describe('Accessibility Utils', () => {
  it('should manage focus correctly', () => {
    document.body.innerHTML = `
      <button id="first">First</button>
      <button id="second">Second</button>
      <button id="third">Third</button>
    `;
    
    const firstButton = document.getElementById('first');
    const secondButton = document.getElementById('second');
    
    firstButton?.focus();
    focusNextElement(firstButton);
    expect(document.activeElement).toBe(secondButton);
  });
});
