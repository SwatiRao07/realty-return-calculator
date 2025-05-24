import { describe, it, expect, vi } from 'vitest';
import { calculateMonthlyInterestLogic, Payment } from './interestCalculator';

// Mock monthToDate from the correct path
vi.mock('@/components/payments/utils.tsx', () => ({
  monthToDate: (month: number): Date => {
    const year = Math.floor(month / 12);
    const monthIndex = month % 12; // 0-indexed month
    return new Date(year, monthIndex, 1); // Day 1 of the month
  },
}));

describe('calculateMonthlyInterestLogic', () => {
  it('should compound interest correctly month over month', () => {
    const initialPayments: Payment[] = [
      {
        id: '1',
        amount: 4381383,
        type: 'payment',
        date: new Date('2025-06-01'), 
        month: 5 + 2025 * 12, // June 2025 (0-indexed month for consistency with Date.getMonth())
        description: 'Initial Principal Balance',
      },
    ];
    const interestRate = 12; 

    const resultJune = calculateMonthlyInterestLogic({ payments: initialPayments, interestRate });
    const juneInterestPayment = resultJune.newInterestPayments.find(
      (p) => p.date && new Date(p.date).getFullYear() === 2025 && new Date(p.date).getMonth() === 5 
    );

    expect(juneInterestPayment).toBeDefined();
    const juneInterestAmount = juneInterestPayment?.amount || 0;
    expect(juneInterestAmount).toBeCloseTo(43813.83, 2);

    const principalAfterJuneInterest = 4381383 + juneInterestAmount;
    expect(principalAfterJuneInterest).toBeCloseTo(4381383 + 43813.83, 2); 

    const paymentsForJulyCalc: Payment[] = [
      {
        id: '1', // Original payment
        amount: 4381383,
        type: 'payment',
        date: new Date('2025-06-01'),
        month: 5 + 2025 * 12, 
        description: 'Initial Principal Balance',
      },
      // We don't add the June interest payment itself to the *input* for July's interest calculation logic.
      // The logic should internally use the compounded principal (initial + June's interest) 
      // as the startingBalance for July.
      {
        id: '2',
        amount: 100000, 
        type: 'payment',
        date: new Date('2025-07-01'),
        month: 6 + 2025 * 12, // July 2025
        description: 'July Payment',
      }
    ];

    const resultJuly = calculateMonthlyInterestLogic({ payments: paymentsForJulyCalc, interestRate });
    const julyInterestPayment = resultJuly.newInterestPayments.find(
      (p) => p.date && new Date(p.date).getFullYear() === 2025 && new Date(p.date).getMonth() === 6 
    );

    expect(julyInterestPayment).toBeDefined();
    const julyInterestAmount = julyInterestPayment?.amount || 0;

    const expectedPrincipalForJulyFullMonth = principalAfterJuneInterest; // This is the key check for compounding
    const expectedJulyInterestOnOldBalance = expectedPrincipalForJulyFullMonth * (0.12 / 12);
    
    const julyPaymentAmount = 100000;
    const daysInJuly = 31;
    const julyPaymentDateDay = 1; // Payment on the 1st
    const daysRemainingForJulyPayment = daysInJuly - julyPaymentDateDay + 1; 
    const expectedInterestOnJulyPayment = julyPaymentAmount * (0.12 / 365) * daysRemainingForJulyPayment;

    const totalExpectedJulyInterest = expectedJulyInterestOnOldBalance + expectedInterestOnJulyPayment;
    
    expect(julyInterestAmount).toBeCloseTo(totalExpectedJulyInterest, 2);
  });

  it('should handle mid-month payments correctly for interest calculation', () => {
    const payments: Payment[] = [
      {
        id: 'p1',
        amount: 100000,
        type: 'payment',
        date: new Date('2025-07-15'), // July 15th
        month: 6 + 2025 * 12, // July
        description: 'Mid-month payment',
      },
    ];
    const interestRate = 12;

    const result = calculateMonthlyInterestLogic({ payments, interestRate });
    const julyInterest = result.newInterestPayments.find(
      p => p.date && new Date(p.date).getMonth() === 6 && new Date(p.date).getFullYear() === 2025
    );

    expect(julyInterest).toBeDefined();

    const daysInJuly = 31;
    const paymentDateDay = 15;
    const daysRemaining = daysInJuly - paymentDateDay + 1; // 17 days
    const expectedInterest = 100000 * (0.12 / 365) * daysRemaining;

    expect(julyInterest?.amount).toBeCloseTo(expectedInterest, 2);
    expect(julyInterest?.description).toContain('1,00,000 (17 days)');
  });

});
