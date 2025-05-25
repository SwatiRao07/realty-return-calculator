import { useState, useMemo, useCallback } from 'react';
import { Payment, ProjectData } from '@/types/project';
import { calculateMonthlyInterestLogic, CalculatedInterestResult } from '@/utils/interestCalculator';
import { monthToDate, dateToMonth } from '@/components/payments/utils';

interface UseInterestCalculatorProps {
  projectData: ProjectData;
  interestRate: number;
}

export const useInterestCalculator = ({ projectData, interestRate }: UseInterestCalculatorProps) => {
  // State for interest calculation results
  const [currentInterestDetails, setCurrentInterestDetails] = useState<CalculatedInterestResult | null>(null);

  // Calculate derived project end date
  const projectEndDate = useMemo(() => {
    if (!projectData) return new Date();
    return calculateDerivedProjectEndDate(projectData);
  }, [projectData]);

  // Calculate interest for all payments
  const calculateInterest = useCallback((): CalculatedInterestResult | null => {
    console.log('calculateInterest called with:', { 
      paymentCount: projectData?.payments?.length,
      interestRate,
      projectEndDate
    });
    
    if (!projectData?.payments?.length) {
      console.log('No payments to calculate interest for');
      return null;
    }
    
    const result = calculateMonthlyInterestLogic({
      payments: projectData.payments,
      interestRate: interestRate,
      projectEndDate,
    });
    
    console.log('Interest calculation result:', result);
    setCurrentInterestDetails(result);
    return result;
  }, [projectData?.payments, interestRate, projectEndDate]);

  // Get all entries for the table (payments + interest)
  const allEntriesForTable = useMemo(() => {
    const entries = [...(projectData.payments || [])];
    
    // If we have interest details, include those entries
    if (currentInterestDetails?.allPaymentsWithInterest?.length) {
      // Use allPaymentsWithInterest which already includes both payments and interest
      return [...currentInterestDetails.allPaymentsWithInterest].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : monthToDate(a.month);
        const dateB = b.date ? new Date(b.date) : monthToDate(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    }
    
    // If no interest details yet, just return the payments
    return entries.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : monthToDate(a.month);
      const dateB = b.date ? new Date(b.date) : monthToDate(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [projectData.payments, currentInterestDetails]);

  return {
    currentInterestDetails,
    allEntriesForTable,
    projectEndDate,
    calculateInterest,
  };
};

// Helper function to calculate derived project end date
const calculateDerivedProjectEndDate = (projectData: ProjectData): Date => {
  if (!projectData?.payments?.length) return new Date();
  
  // Get the latest date from payments
  const latestPayment = projectData.payments.reduce((latest, payment) => {
    const paymentDate = payment.date ? new Date(payment.date) : monthToDate(payment.month);
    return (!latest || paymentDate > latest) ? paymentDate : latest;
  }, null as Date | null);
  
  // If we have a latest payment, return 3 months after that
  if (latestPayment) {
    const result = new Date(latestPayment);
    result.setMonth(result.getMonth() + 3);
    return result;
  }
  
  // Default to 3 months from now
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  return threeMonthsFromNow;
};
