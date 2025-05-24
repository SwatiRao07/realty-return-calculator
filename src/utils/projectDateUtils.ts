import { Payment } from '@/types/project';
import { endOfMonth, max } from 'date-fns';
import { monthToDate } from '@/components/payments/utils'; // Assuming this path is correct

/**
 * Calculates the project end date based on the latest cash flow entry.
 * The project end date is the end of the month of the latest payment or return.
 * If there are no payments, returns null.
 * @param payments - Array of Payment objects.
 * @returns The project end date (end of the month) or null.
 */
export const calculateDerivedProjectEndDate = (payments: Payment[]): Date | null => {
  if (!payments || payments.length === 0) {
    return null;
  }

  const latestDate = payments.reduce((latest, payment) => {
    const paymentDate = payment.date ? new Date(payment.date) : monthToDate(payment.month);
    return max([latest, paymentDate]);
  }, new Date(0)); // Initialize with a very early date

  if (latestDate.getTime() === new Date(0).getTime()) {
    // Should not happen if payments array is not empty and dates are valid
    return null;
  }

  return endOfMonth(latestDate);
};
