import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ProjectData } from '@/types/project';
import { 
  IndianRupee, 
  Percent, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  DollarSign,
  Calculator,
  PiggyBank
} from 'lucide-react';

interface AnalysisSetupProps {
  projectData: ProjectData;
  updateProjectData: (updates: Partial<ProjectData>) => void;
}

export const AnalysisSetup: React.FC<AnalysisSetupProps> = ({ 
  projectData, 
  updateProjectData 
}) => {
  // Handler for interest rate changes
  const handleInterestRateChange = (value: number) => {
    // Update both the monthly and annual interest rates
    const monthlyRate = value / 1200; // Convert from annual percentage to monthly decimal
    updateProjectData({ 
      annualInterestRate: value,
      monthlyInterestRate: monthlyRate
    });
  };

  // Financial calculations
  const financialMetrics = useMemo(() => {
    const totalInvestment = projectData.purchasePrice + 
                           projectData.closingCosts + 
                           projectData.renovationCosts;
    
    const grossReturn = projectData.salePrice - projectData.sellingCosts;
    
    const grossProfit = grossReturn - totalInvestment;
    
    // Calculate total interest over the project duration
    const totalInterest = projectData.payments
      .filter(payment => payment.type === 'interest')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate net profit (after interest)
    const netProfit = grossProfit - totalInterest;
    
    // Calculate ROI
    const roi = (grossProfit / totalInvestment) * 100;
    
    // Calculate annualized ROI
    const annualizedRoi = projectData.saleMonth > 0 
      ? (roi / projectData.saleMonth) * 12 
      : 0;
    
    // Calculate debt metrics if there are debt-funded payments
    const totalDebtFunded = projectData.payments
      .filter(payment => payment.debtFunded)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const leverageRatio = totalInvestment > 0 
      ? totalDebtFunded / totalInvestment 
      : 0;
    
    // Calculate total rental income
    const totalRentalIncome = projectData.rentalIncome
      .reduce((sum, income) => sum + income.amount, 0);

    // Calculate holding period in months
    const holdingPeriod = projectData.saleMonth;
    
    return {
      totalInvestment,
      grossReturn,
      grossProfit,
      totalInterest,
      netProfit,
      roi,
      annualizedRoi,
      totalDebtFunded,
      leverageRatio,
      totalRentalIncome,
      holdingPeriod
    };
  }, [projectData]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage values
  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Interest Rate Settings Card */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-md font-medium flex items-center gap-2">
            <Percent className="w-4 h-4 text-purple-600" />
            Interest Rate Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="annualInterestRate">Annual Interest Rate (%)</Label>
              <Input
                id="annualInterestRate"
                type="number"
                step="0.01"
                value={projectData.annualInterestRate}
                onChange={(e) => handleInterestRateChange(Number(e.target.value))}
                placeholder="12.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(projectData.monthlyInterestRate * 100).toFixed(3)}% monthly rate
              </p>
            </div>
            <div>
              <Label htmlFor="discountRate">Discount Rate for NPV (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.01"
                value={(projectData.discountRate * 100).toFixed(2)}
                onChange={(e) => updateProjectData({ discountRate: Number(e.target.value) / 100 })}
                placeholder="12.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for Net Present Value calculations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Financial Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Investment</p>
              </div>
              <p className="text-xl font-bold text-blue-600 mt-2">
                {formatCurrency(financialMetrics.totalInvestment)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-gray-600">Gross Return</p>
              </div>
              <p className="text-xl font-bold text-green-600 mt-2">
                {formatCurrency(financialMetrics.grossReturn)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
              </div>
              <p className="text-xl font-bold text-purple-600 mt-2">
                {formatCurrency(financialMetrics.netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-600" />
            Detailed Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Metric</TableHead>
                <TableHead className="w-1/3">Value</TableHead>
                <TableHead className="w-1/3">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Return on Investment (ROI)
                </TableCell>
                <TableCell className="text-green-600 font-bold">
                  {formatPercent(financialMetrics.roi)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  Total return relative to investment
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Annualized ROI
                </TableCell>
                <TableCell className="text-blue-600 font-bold">
                  {formatPercent(financialMetrics.annualizedRoi)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  ROI expressed as an annual rate
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-600" />
                  Total Interest Paid
                </TableCell>
                <TableCell className="text-purple-600 font-bold">
                  {formatCurrency(financialMetrics.totalInterest)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  Interest paid over the project duration
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  Leverage Ratio
                </TableCell>
                <TableCell className="text-orange-600 font-bold">
                  {financialMetrics.leverageRatio.toFixed(2)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  Ratio of debt to total investment
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-green-600" />
                  Total Rental Income
                </TableCell>
                <TableCell className="text-green-600 font-bold">
                  {formatCurrency(financialMetrics.totalRentalIncome)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  Total income from rentals during holding period
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Holding Period
                </TableCell>
                <TableCell className="text-blue-600 font-bold">
                  {financialMetrics.holdingPeriod} months
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  Duration from purchase to sale
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
