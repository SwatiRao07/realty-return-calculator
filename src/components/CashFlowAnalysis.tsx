
import React, { useMemo } from 'react';
import { ProjectData, CashFlowRow } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CashFlowAnalysisProps {
  projectData: ProjectData;
}

export const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ projectData }) => {
  const getMonthYearDisplay = (month: number): string => {
    const baselineYear = 2024;
    const baselineMonth = 1;
    
    const totalMonths = month - 1 + baselineMonth - 1;
    const year = baselineYear + Math.floor(totalMonths / 12);
    const monthNum = (totalMonths % 12) + 1;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[monthNum - 1]} ${year}`;
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
    const maxMonth = Math.max(maxPaymentMonth, maxReturnMonth, projectData.saleMonth || 0);

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

      // Calculate interest on outstanding balance
      const interest = outstandingBalance * (projectData.monthlyInterestRate || 0);

      // Rental income from the rentalIncome array
      const rental = projectData.rentalIncome
        .filter(r => r.month === month)
        .reduce((sum, r) => sum + r.amount, 0);

      // Sale proceeds in the final month
      const sale = month === projectData.saleMonth 
        ? (projectData.salePrice || 0) - (projectData.sellingCosts || 0) - outstandingBalance
        : 0;

      // If sale happens, outstanding balance becomes 0
      if (month === projectData.saleMonth) {
        outstandingBalance = 0;
      }

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
          outstandingBalance: month === projectData.saleMonth ? 0 : outstandingBalance
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

  const finalCashFlow = cashFlowData[cashFlowData.length - 1]?.cumulativeCashFlow || 0;

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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Investment</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(
                Math.abs(cashFlowData.reduce((sum, row) => 
                  sum + Math.min(0, row.payments + row.interest), 0
                ))
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Returns</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(
                cashFlowData.reduce((sum, row) => 
                  sum + Math.max(0, row.rental + row.sale), 0
                )
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${finalCashFlow >= 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {finalCashFlow >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-600">Net Cash Flow</span>
            </div>
            <p className={`text-xl font-bold ${finalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(finalCashFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Table */}
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-semibold border-r">Month</th>
              <th className="text-right p-3 font-semibold border-r">Payments</th>
              <th className="text-right p-3 font-semibold border-r">Interest</th>
              <th className="text-right p-3 font-semibold border-r">Rental</th>
              <th className="text-right p-3 font-semibold border-r">Sale Proceeds</th>
              <th className="text-right p-3 font-semibold border-r bg-blue-50">Net Cash Flow</th>
              <th className="text-right p-3 font-semibold border-r bg-green-50">Cumulative</th>
              <th className="text-right p-3 font-semibold">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {cashFlowData.map((row, index) => (
              <tr key={row.month} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <td className="p-3 font-medium border-r">
                  {getMonthYearDisplay(row.month)}
                </td>
                <td className={`p-3 text-right border-r ${getCellStyle(row.payments)}`}>
                  {formatNumber(row.payments)}
                </td>
                <td className={`p-3 text-right border-r ${getCellStyle(row.interest)}`}>
                  {formatNumber(row.interest)}
                </td>
                <td className={`p-3 text-right border-r ${getCellStyle(row.rental)}`}>
                  {formatNumber(row.rental)}
                </td>
                <td className={`p-3 text-right border-r ${getCellStyle(row.sale)}`}>
                  {formatNumber(row.sale)}
                </td>
                <td className={`p-3 text-right border-r bg-blue-25 ${getCellStyle(row.netCashFlow, true)}`}>
                  {formatNumber(row.netCashFlow)}
                </td>
                <td className={`p-3 text-right border-r bg-green-25 ${getCellStyle(row.cumulativeCashFlow, true)}`}>
                  {formatNumber(row.cumulativeCashFlow)}
                </td>
                <td className="p-3 text-right text-gray-600">
                  {formatNumber(row.outstandingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
