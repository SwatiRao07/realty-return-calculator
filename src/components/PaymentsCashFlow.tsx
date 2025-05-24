import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Payment, ProjectData } from '@/types/project';
import { Upload, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CashFlowAnalysis } from '@/components/CashFlowAnalysis';

interface PaymentsCashFlowProps {
  projectData: ProjectData;
  updateProjectData: (updates: Partial<ProjectData>) => void;
  updatePayments: (payments: Payment[]) => void;
}

export const PaymentsCashFlow: React.FC<PaymentsCashFlowProps> = ({ 
  projectData, 
  updateProjectData, 
  updatePayments 
}) => {
  const [csvData, setCsvData] = useState('');
  const [returnsCsvData, setReturnsCsvData] = useState('');
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const parseCurrencyAmount = (amountStr: string): number => {
    // Remove currency symbol, commas, and any other non-numeric characters except decimal point and minus
    const cleanAmount = amountStr.replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  };

  const parseDate = (dateStr: string): number => {
    // Handle formats like "May-2025", "2025-05", or direct month numbers
    if (!isNaN(Number(dateStr))) {
      return Number(dateStr);
    }
    
    try {
      // Handle "May-2025" format
      if (dateStr.includes('-')) {
        const [monthPart, yearPart] = dateStr.split('-');
        let month: number;
        let year: number;
        
        // Check if first part is month name or number
        if (isNaN(Number(monthPart))) {
          // Month name like "May"
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          month = monthNames.findIndex(name => monthPart.toLowerCase().startsWith(name.toLowerCase())) + 1;
          year = parseInt(yearPart);
        } else {
          // Numeric format like "2025-05"
          year = parseInt(monthPart);
          month = parseInt(yearPart);
        }
        
        if (month && year) {
          // Calculate months from January 2024 as baseline
          const baselineYear = 2024;
          const baselineMonth = 1;
          return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
        }
      }
      
      // Try to parse as a regular date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const baselineYear = 2024;
        const baselineMonth = 1;
        return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }
    
    return 1; // Default to month 1 if parsing fails
  };

  const parseCsvData = (csvText: string, isReturns = false) => {
    try {
      const lines = csvText.trim().split('\n');
      const newPayments: Payment[] = [];

      lines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length < 3) return;
        
        const [dateOrMonth, ...amountAndDesc] = parts;
        
        // Handle the case where amount might contain commas (like "₹1,460,461")
        // Join the parts and find where description starts
        const joinedParts = amountAndDesc.join(',');
        
        // Find the last comma that separates amount from description
        const lastCommaIndex = joinedParts.lastIndexOf(',');
        let amount: string;
        let description: string;
        
        if (lastCommaIndex > 0) {
          amount = joinedParts.substring(0, lastCommaIndex);
          description = joinedParts.substring(lastCommaIndex + 1);
        } else {
          amount = joinedParts;
          description = '';
        }
        
        if (!dateOrMonth.trim() || !amount.trim()) return;

        const month = parseDate(dateOrMonth.trim());
        const amountValue = parseCurrencyAmount(amount.trim());
        
        newPayments.push({
          id: Math.random().toString(36).substr(2, 9),
          month: month,
          amount: Math.abs(amountValue), // Store as positive, sign will be handled in display
          description: description.trim() || (isReturns ? `Return ${month}` : `Payment ${month}`),
          debtFunded: false
        });
      });

      if (isReturns) {
        const newRentalIncome = newPayments.map(p => ({
          month: p.month,
          amount: p.amount,
          type: 'rental' as const
        }));
        updateProjectData({ 
          rentalIncome: [...projectData.rentalIncome, ...newRentalIncome] 
        });
        setReturnsCsvData('');
      } else {
        updatePayments([...projectData.payments, ...newPayments]);
        setCsvData('');
      }

      toast({
        title: "Success",
        description: `Imported ${newPayments.length} ${isReturns ? 'returns' : 'payments'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV data",
        variant: "destructive",
      });
    }
  };

  const addManualPayment = (isReturn = false) => {
    if (isReturn) {
      const newReturn = {
        month: 1,
        amount: 0,
        type: 'rental' as const
      };
      updateProjectData({ 
        rentalIncome: [...projectData.rentalIncome, newReturn] 
      });
    } else {
      const newPayment: Payment = {
        id: Math.random().toString(36).substr(2, 9),
        month: 1,
        amount: 0,
        description: 'New Payment',
        debtFunded: false
      };
      updatePayments([...projectData.payments, newPayment]);
    }
  };

  const updatePayment = (id: string, field: keyof Payment, value: any) => {
    const updatedPayments = projectData.payments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    );
    updatePayments(updatedPayments);
  };

  const removePayment = (id: string) => {
    updatePayments(projectData.payments.filter(payment => payment.id !== id));
  };

  const removeReturn = (index: number) => {
    const updatedReturns = projectData.rentalIncome.filter((_, i) => i !== index);
    updateProjectData({ rentalIncome: updatedReturns });
  };

  const updateReturn = (index: number, field: string, value: any) => {
    const updatedReturns = projectData.rentalIncome.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    updateProjectData({ rentalIncome: updatedReturns });
  };

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

  const sortedPayments = [...projectData.payments].sort((a, b) => a.month - b.month);
  const sortedReturns = [...projectData.rentalIncome].sort((a, b) => a.month - b.month);
  const totalPayments = projectData.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReturns = projectData.rentalIncome.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Import Payments (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csvData">Paste CSV Data</Label>
                  <Textarea
                    id="csvData"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="May-2025,₹1,460,461,On Booking
Jun-2025,₹2,920,922,On Agreement
Jul-2025,₹2,044,645,On Foundation"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: Date (May-2025), Amount (₹1,460,461), Description
                  </p>
                </div>
                <Button 
                  onClick={() => parseCsvData(csvData, false)} 
                  disabled={!csvData.trim()}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Payments
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => addManualPayment(false)}
                  className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Month: Project month number (1, 2, 3...)</p>
                  <p>• Amount: Payment amount in INR (outflow)</p>
                  <p>• Description: Payment description</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {projectData.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Schedule ({projectData.payments.length} payments)</span>
                  <span className="text-lg font-bold text-red-600">
                    Total: {formatCurrency(totalPayments)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Month</th>
                        <th className="text-left p-3 font-medium">Amount (₹)</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayments.map((payment, index) => (
                        <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <Input
                                type="number"
                                value={payment.month || ''}
                                onChange={(e) => updatePayment(payment.id, 'month', Number(e.target.value))}
                                className="w-20 mb-1"
                                min="1"
                              />
                              <span className="text-xs text-gray-500">
                                {payment.month ? getMonthYearDisplay(payment.month) : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={payment.amount || ''}
                              onChange={(e) => updatePayment(payment.id, 'amount', Number(e.target.value))}
                              className="w-32"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={payment.description || ''}
                              onChange={(e) => updatePayment(payment.id, 'description', e.target.value)}
                              className="min-w-40"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePayment(payment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Import Returns (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="returnsCsvData">Paste CSV Data</Label>
                  <Textarea
                    id="returnsCsvData"
                    value={returnsCsvData}
                    onChange={(e) => setReturnsCsvData(e.target.value)}
                    placeholder="Jun-2026,₹25,000,Monthly Rent
Jul-2026,₹25,000,Monthly Rent
Mar-2028,₹80,00,000,Property Sale"
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: Date (Jun-2026), Amount (₹25,000), Description
                  </p>
                </div>
                <Button 
                  onClick={() => parseCsvData(returnsCsvData, true)} 
                  disabled={!returnsCsvData.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Returns
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => addManualPayment(true)}
                  className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Return
                </Button>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Month: Project month number (1, 2, 3...)</p>
                  <p>• Amount: Return amount in INR (inflow)</p>
                  <p>• Description: Return description</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {projectData.rentalIncome.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Returns Schedule ({projectData.rentalIncome.length} returns)</span>
                  <span className="text-lg font-bold text-green-600">
                    Total: {formatCurrency(totalReturns)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium">Month</th>
                        <th className="text-left p-3 font-medium">Amount (₹)</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReturns.map((returnItem, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <Input
                                type="number"
                                value={returnItem.month || ''}
                                onChange={(e) => updateReturn(index, 'month', Number(e.target.value))}
                                className="w-20 mb-1"
                                min="1"
                              />
                              <span className="text-xs text-gray-500">
                                {returnItem.month ? getMonthYearDisplay(returnItem.month) : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={returnItem.amount || ''}
                              onChange={(e) => updateReturn(index, 'amount', Number(e.target.value))}
                              className="w-32"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={`Rental Income Month ${returnItem.month}`}
                              onChange={(e) => updateReturn(index, 'description', e.target.value)}
                              className="min-w-40"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeReturn(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowAnalysis projectData={projectData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
