
import React, { useMemo } from 'react';
import { ProjectData } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calculator, Target, DollarSign } from 'lucide-react';

interface FinancialMetricsProps {
  projectData: ProjectData;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ projectData }) => {
  const metrics = useMemo(() => {
    // Calculate cash flows
    const cashFlows: number[] = [];
    let outstandingBalance = 0;

    // Initial investment
    const initialInvestment = projectData.purchasePrice + projectData.closingCosts;
    cashFlows.push(-initialInvestment);
    outstandingBalance = initialInvestment;

    // Monthly cash flows
    for (let month = 1; month <= projectData.saleMonth; month++) {
      const monthPayments = projectData.payments
        .filter(p => p.month === month)
        .reduce((sum, p) => sum + p.amount, 0);

      const debtFundedPayments = projectData.payments
        .filter(p => p.month === month && p.debtFunded)
        .reduce((sum, p) => sum + p.amount, 0);

      const equityPayments = monthPayments - debtFundedPayments;
      outstandingBalance += debtFundedPayments;

      const interest = outstandingBalance * projectData.monthlyInterestRate;
      const rental = 0; // Simplified for now

      let sale = 0;
      if (month === projectData.saleMonth) {
        sale = projectData.salePrice - projectData.sellingCosts - outstandingBalance;
        outstandingBalance = 0;
      }

      const netCashFlow = -equityPayments - interest + rental + sale;
      cashFlows.push(netCashFlow);
    }

    // Calculate IRR using Newton-Raphson method
    const calculateIRR = (cashFlows: number[], guess = 0.1): number => {
      const maxIterations = 100;
      const tolerance = 1e-6;
      let rate = guess;

      for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;

        for (let j = 0; j < cashFlows.length; j++) {
          npv += cashFlows[j] / Math.pow(1 + rate, j);
          dnpv -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
        }

        const newRate = rate - npv / dnpv;
        
        if (Math.abs(newRate - rate) < tolerance) {
          return newRate;
        }
        
        rate = newRate;
      }
      
      return rate;
    };

    // Calculate NPV
    const calculateNPV = (cashFlows: number[], discountRate: number): number => {
      return cashFlows.reduce((npv, cashFlow, period) => {
        return npv + cashFlow / Math.pow(1 + discountRate / 12, period);
      }, 0);
    };

    const irr = calculateIRR(cashFlows);
    const npv = calculateNPV(cashFlows, projectData.discountRate);
    const totalInvestment = Math.abs(cashFlows.reduce((sum, cf) => sum + Math.min(0, cf), 0));
    const totalReturns = cashFlows.reduce((sum, cf) => sum + Math.max(0, cf), 0);
    const roi = ((totalReturns - totalInvestment) / totalInvestment) * 100;

    return {
      irr: irr * 12 * 100, // Convert to annual percentage
      npv,
      roi,
      totalInvestment,
      totalReturns,
      paybackPeriod: cashFlows.findIndex((cf, i) => 
        cashFlows.slice(0, i + 1).reduce((sum, c) => sum + c, 0) > 0
      )
    };
  }, [projectData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMetricColor = (value: number, isPercentage = false) => {
    if (isPercentage) {
      return value >= 15 ? 'text-green-600' : value >= 0 ? 'text-yellow-600' : 'text-red-600';
    }
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Internal Rate of Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className={`text-2xl font-bold ${getMetricColor(metrics.irr, true)}`}>
              {formatPercentage(metrics.irr)}
            </p>
            <p className="text-xs text-gray-500">
              Annual return rate
            </p>
            <div className="text-xs">
              {metrics.irr >= 15 ? (
                <span className="text-green-600">● Excellent</span>
              ) : metrics.irr >= 0 ? (
                <span className="text-yellow-600">● Good</span>
              ) : (
                <span className="text-red-600">● Poor</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="w-4 h-4 text-green-600" />
            Net Present Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className={`text-2xl font-bold ${getMetricColor(metrics.npv)}`}>
              {formatCurrency(metrics.npv)}
            </p>
            <p className="text-xs text-gray-500">
              At {formatPercentage(projectData.discountRate * 100)} discount rate
            </p>
            <div className="text-xs">
              {metrics.npv > 0 ? (
                <span className="text-green-600">● Value Creating</span>
              ) : (
                <span className="text-red-600">● Value Destroying</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            Return on Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className={`text-2xl font-bold ${getMetricColor(metrics.roi, true)}`}>
              {formatPercentage(metrics.roi)}
            </p>
            <p className="text-xs text-gray-500">
              Total project ROI
            </p>
            <div className="text-xs">
              {metrics.roi >= 25 ? (
                <span className="text-green-600">● Excellent</span>
              ) : metrics.roi >= 0 ? (
                <span className="text-yellow-600">● Acceptable</span>
              ) : (
                <span className="text-red-600">● Loss</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-600" />
            Payback Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-orange-600">
              {metrics.paybackPeriod > 0 ? `${metrics.paybackPeriod} months` : 'No payback'}
            </p>
            <p className="text-xs text-gray-500">
              Time to recover investment
            </p>
            <div className="text-xs">
              {metrics.paybackPeriod <= 12 ? (
                <span className="text-green-600">● Fast Recovery</span>
              ) : metrics.paybackPeriod <= 24 ? (
                <span className="text-yellow-600">● Moderate</span>
              ) : (
                <span className="text-red-600">● Slow Recovery</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Investment</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(metrics.totalInvestment)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Returns</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(metrics.totalReturns)}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              metrics.totalReturns > metrics.totalInvestment ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Net Profit</p>
              <p className={`text-xl font-bold ${
                metrics.totalReturns > metrics.totalInvestment ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics.totalReturns - metrics.totalInvestment)}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Investment Guidelines</h4>
            <div className="grid gap-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>IRR Target:</span>
                <span>15%+ (Excellent), 10-15% (Good), &lt;10% (Poor)</span>
              </div>
              <div className="flex justify-between">
                <span>NPV:</span>
                <span>Positive value creates wealth</span>
              </div>
              <div className="flex justify-between">
                <span>ROI Target:</span>
                <span>25%+ (Excellent), 15-25% (Good), &lt;15% (Review)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
