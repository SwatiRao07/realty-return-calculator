import React, { useMemo } from 'react';
import { ProjectData, Payment, IncomeItem } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart2, Landmark, Scale, Percent, HandCoins, PiggyBank, CalendarDays } from 'lucide-react';
import { format as formatDateFns } from 'date-fns'; // For formatting projectEndDate

interface CashFlowAnalysisProps {
  projectData: ProjectData;
  allPaymentsWithInterest: Payment[];
  projectEndDate?: Date; // Added projectEndDate prop
}

const calculateXIRR = (paymentsAndOutflows: Payment[], returns: IncomeItem[]): number => {
  try {
    const cashFlows: { amount: number; date: Date }[] = [];
    
    paymentsAndOutflows.forEach(payment => {
      if (payment.type === 'payment') { 
        const date = payment.date ? new Date(payment.date) : monthToDate(payment.month); 
        cashFlows.push({
          amount: -Math.abs(payment.amount), 
          date: date
        });
      }
    });
    
    returns.forEach(income => {
      const date = income.date ? new Date(income.date) : monthToDate(income.month); 
      cashFlows.push({
        amount: Math.abs(income.amount), 
        date: date
      });
    });
    
    cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (cashFlows.length < 2) return 0; 
    
    const values = cashFlows.map(cf => cf.amount);
    const dates = cashFlows.map(cf => cf.date);

    const guess = 0.1; 
    const maxIterations = 100;
    const tolerance = 0.000001;
    let x = guess;

    for (let i = 0; i < maxIterations; i++) {
      let fx = 0;
      let dfx = 0;
      const firstDate = dates[0].getTime();

      for (let j = 0; j < values.length; j++) {
        const days = (dates[j].getTime() - firstDate) / (1000 * 60 * 60 * 24);
        const term = Math.pow(1 + x, -days / 365);
        fx += values[j] * term;
        if (x !== -1) { 
            dfx += (-days / 365) * values[j] * Math.pow(1 + x, (-days / 365) - 1);
        } else {
            return NaN; 
        }
      }

      if (Math.abs(dfx) < 1e-10 || isNaN(dfx)) {
        break; 
      }
      
      const newX = x - fx / dfx;
      if (Math.abs(newX - x) < tolerance) {
        return newX * 100; 
      }
      x = newX;
    }
    return NaN; 
  } catch (error) {
    console.error('Error calculating XIRR:', error);
    return 0; 
  }
};

import { monthToDate } from '@/components/payments/utils'; 

export const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ projectData, allPaymentsWithInterest, projectEndDate }) => {
  const analysisSummary = useMemo(() => {
    if (!projectData) return {
      totalInvestment: 0,
      totalReturns: 0,
      netProfit: 0,
      totalInterestPaid: 0,
      xirrValue: 0
    };

    let totalInvestment = 0;
    projectData.payments.forEach(p => {
      if (p.type === 'payment') { 
        totalInvestment += p.amount;
      }
    });

    let totalInterestPaid = 0;
    allPaymentsWithInterest.forEach(p => {
      if (p.type === 'interest') {
        totalInterestPaid += p.amount;
      }
    });

    let totalReturns = 0;
    projectData.rentalIncome.forEach(ri => {
      totalReturns += ri.amount;
    });

    const netProfit = totalReturns - totalInvestment;
    
    const principalPaymentsForXIRR = projectData.payments.filter(p => p.type === 'payment');
    const xirrValue = calculateXIRR(principalPaymentsForXIRR, projectData.rentalIncome);

    return { totalInvestment, totalReturns, netProfit, totalInterestPaid, xirrValue };
  }, [projectData, allPaymentsWithInterest]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; description?: string }> = 
    ({ title, value, icon, description }) => (
    <Card className="flex-1 min-w-[200px] shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  if (!projectData) {
    return <p>No project data available for analysis.</p>;
  }

  return (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Project Financial Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <MetricCard 
          title="Total Investment"
          value={formatCurrency(analysisSummary.totalInvestment)}
          icon={<Landmark className="h-5 w-5 text-blue-500" />}
          description="Total principal payments made"
        />
        <MetricCard 
          title="Total Returns"
          value={formatCurrency(analysisSummary.totalReturns)}
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          description="Total rental and sale income"
        />
        <MetricCard 
          title="Net Profit"
          value={formatCurrency(analysisSummary.netProfit)}
          icon={<Scale className="h-5 w-5 text-purple-500" />}
          description="Total Returns - Total Investment"
        />
        <MetricCard 
          title="Total Interest Paid"
          value={formatCurrency(analysisSummary.totalInterestPaid)}
          icon={<HandCoins className="h-5 w-5 text-red-500" />}
          description="Cumulative interest paid on debt"
        />
        <MetricCard 
          title="XIRR"
          value={`${analysisSummary.xirrValue.toFixed(2)}%`}
          icon={<Percent className="h-5 w-5 text-yellow-500" />}
          description="Internal Rate of Return"
        />
        {projectEndDate && (
          <MetricCard 
            title="Project End Date"
            value={formatDateFns(projectEndDate, 'MMM dd, yyyy')}
            icon={<CalendarDays className="h-5 w-5 text-teal-500" />}
            description="Derived from last cash flow"
          />
        )}
      </div>
    </div>
  );
};
