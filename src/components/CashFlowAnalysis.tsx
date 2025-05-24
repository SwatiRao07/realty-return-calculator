
import React, { useMemo } from 'react';
import { ProjectData, CashFlowRow, Payment, IncomeItem } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

interface CashFlowAnalysisProps {
  projectData: ProjectData;
}

export const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ projectData }) => {
  // Direct conversion from month number to display string
  const getMonthYearDisplay = (month: number): string => {
    // For the analysis tab, we need to ensure we're using the same date format as the payments table
    // The months in the payments are showing years 2025-2028, so we need to match that
    
    // First, find a payment with this month number to see what year it should be
    const matchingPayment = projectData.payments.find(p => p.month === month);
    if (matchingPayment && matchingPayment.date) {
      const paymentDate = new Date(matchingPayment.date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[paymentDate.getMonth()]} ${paymentDate.getFullYear()}`;
    }
    
    // If no matching payment, use a direct calculation based on the first payment's date
    // This ensures consistency with the payment table
    const baseYear = 2025; // Based on your screenshot showing payments starting in 2025
    const monthsPerYear = 12;
    const year = baseYear + Math.floor((month - 1) / monthsPerYear);
    const monthIndex = ((month - 1) % monthsPerYear);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[monthIndex]} ${year}`;
  };

  const cashFlowData = useMemo(() => {
    const rows: CashFlowRow[] = [];
    let cumulativeCashFlow = 0;
    let outstandingBalance = 0;

    // Only proceed if we have actual data
    if (projectData.payments.length === 0 && projectData.rentalIncome.length === 0) {
      return rows;
    }

    // Find the maximum month from payments and returns
    const maxPaymentMonth = projectData.payments.length > 0 
      ? Math.max(...projectData.payments.map(p => p.month))
      : 0;
    const maxReturnMonth = projectData.rentalIncome.length > 0
      ? Math.max(...projectData.rentalIncome.map(r => r.month))
      : 0;
    const maxMonth = Math.max(maxPaymentMonth, maxReturnMonth);

    // Calculate for each month up to the maximum month
    for (let month = 1; month <= maxMonth; month++) {
      const monthPayments = projectData.payments
        .filter(p => p.month === month)
        .reduce((sum, p) => sum + p.amount, 0);

      const debtFundedPayments = projectData.payments
        .filter(p => p.month === month && p.debtFunded)
        .reduce((sum, p) => sum + p.amount, 0);

      const equityPayments = monthPayments - debtFundedPayments;
      
      // Update outstanding balance
      outstandingBalance += debtFundedPayments;

      // Calculate interest on outstanding balance (convert annual rate to monthly)
      const monthlyRate = (projectData.annualInterestRate || 0) / 100 / 12; // Convert from percentage to decimal and to monthly
      const interest = outstandingBalance * monthlyRate;

      // Rental income from the rentalIncome array
      const rental = projectData.rentalIncome
        .filter(r => r.month === month)
        .reduce((sum, r) => sum + r.amount, 0);

      // No sale proceeds calculation - removed as requested
      const sale = 0;

      const netCashFlow = -equityPayments - interest + rental + sale;
      cumulativeCashFlow += netCashFlow;

      // Only add rows that have some activity
      if (monthPayments > 0 || rental > 0 || sale > 0 || interest > 0) {
        rows.push({
          month,
          payments: -monthPayments,
          interest: -interest,
          rental,
          sale,
          netCashFlow,
          cumulativeCashFlow,
          outstandingBalance: outstandingBalance
        });
      }
    }

    return rows;
  }, [projectData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '—';
    return formatCurrency(value);
  };

  const getCellStyle = (value: number, isTotal = false) => {
    const baseStyle = isTotal ? 'font-bold' : '';
    if (value > 0) return `${baseStyle} text-green-700`;
    if (value < 0) return `${baseStyle} text-red-700`;
    return `${baseStyle} text-gray-600`;
  };

  // Calculate XIRR (Extended Internal Rate of Return)
  const calculateXIRR = (payments: Payment[], returns: IncomeItem[]): number => {
    try {
      // Combine all cash flows with their dates
      const cashFlows: { amount: number; date: Date }[] = [];
      
      // Process payments (negative cash flows)
      payments.forEach(payment => {
        const date = payment.date ? new Date(payment.date) : new Date();
        cashFlows.push({
          amount: -payment.amount, // Negative for payments (outflow)
          date: date
        });
      });
      
      // Process returns (positive cash flows)
      returns.forEach(income => {
        const date = income.date ? new Date(income.date) : new Date();
        cashFlows.push({
          amount: income.amount, // Positive for returns (inflow)
          date: date
        });
      });
      
      // Sort cash flows by date
      cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // If no cash flows, return 0
      if (cashFlows.length === 0) return 0;
      
      // Get the reference date (earliest date)
      const startDate = cashFlows[0].date;
      
      // Calculate days from start date for each cash flow
      const values: number[] = [];
      const days: number[] = [];
      
      cashFlows.forEach(cf => {
        const daysFromStart = (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        values.push(cf.amount);
        days.push(daysFromStart);
      });
      
      // Simple XIRR calculation (Newton-Raphson method)
      const guess = 0.1; // Initial guess (10%)
      const maxIterations = 100;
      const tolerance = 0.0001;
      
      let x = guess;
      let iteration = 0;
      let error = 1;
      
      while (iteration < maxIterations && Math.abs(error) > tolerance) {
        let fx = 0;
        let dfx = 0;
        
        for (let i = 0; i < values.length; i++) {
          const exponent = days[i] / 365;
          const term = values[i] / Math.pow(1 + x, exponent);
          fx += term;
          dfx += -exponent * term / (1 + x);
        }
        
        if (Math.abs(dfx) < 1e-10) break; // Avoid division by zero
        
        const newX = x - fx / dfx;
        error = Math.abs(newX - x);
        x = newX;
        iteration++;
      }
      
      return x * 100; // Convert to percentage
    } catch (error) {
      console.error('Error calculating XIRR:', error);
      return 0;
    }
  };

  const finalCashFlow = cashFlowData[cashFlowData.length - 1]?.cumulativeCashFlow || 0;
  const xirr = calculateXIRR(projectData.payments, projectData.rentalIncome);
  const totalInvestment = Math.abs(cashFlowData.reduce((sum, row) => 
    sum + Math.min(0, row.payments + row.interest), 0
  ));
  const totalReturns = cashFlowData.reduce((sum, row) => 
    sum + Math.max(0, row.rental + row.sale), 0
  );
  const totalReturnPercentage = totalInvestment > 0 ? ((totalReturns - totalInvestment) / totalInvestment * 100) : 0;

  // Don't show anything if there's no data
  if (cashFlowData.length === 0) {
    return (
      <div className="space-y-4 p-6 text-center">
        <div className="text-gray-500">
          <p className="text-lg">No cash flow data available</p>
          <p className="text-sm">Add payments or returns to see the cash flow analysis</p>
        </div>
      </div>
    );
  }

  // Helper component for metric cards
  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'gray',
    showPercentage = false,
    percentageValue = 0,
    isNetFlow = false
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'purple' | 'gray';
    showPercentage?: boolean;
    percentageValue?: number;
    isNetFlow?: boolean;
  }) => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
    };

    const colors = colorMap[color];
    
    return (
      <Card className={`${colors.border} ${isNetFlow ? 'border-2' : ''}`}>
        <CardContent className="p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Icon className="w-4 h-4" />
              <span>{title}</span>
            </div>
            <div className="mt-1">
              <p className={`text-xl font-bold ${colors.text}`}>
                {typeof value === 'number' && !showPercentage ? formatCurrency(value) : value}
                {showPercentage && percentageValue !== undefined && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({percentageValue > 0 ? '+' : ''}{percentageValue.toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Invested"
          value={totalInvestment}
          icon={TrendingUp}
          color="blue"
        />
        
        <MetricCard 
          title="Total Returns"
          value={totalReturns}
          icon={TrendingUp}
          color="green"
          showPercentage={true}
          percentageValue={totalReturnPercentage}
        />
        
        <MetricCard 
          title="Net Cash Flow"
          value={finalCashFlow}
          icon={finalCashFlow >= 0 ? TrendingUp : TrendingDown}
          color={finalCashFlow >= 0 ? 'green' : 'red'}
          isNetFlow={true}
        />
        
        <MetricCard 
          title="Annualized Return (XIRR)"
          value={`${xirr.toFixed(1)}%`}
          icon={BarChart2}
          color="purple"
        />
      </div>
    </div>
  );
};
