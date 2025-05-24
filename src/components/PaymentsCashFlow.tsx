
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Payment, ProjectData } from '@/types/project';
import { Upload, Plus, Trash2, TrendingUp, TrendingDown, CalendarIcon, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CashFlowAnalysis } from '@/components/CashFlowAnalysis';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingReturn, setEditingReturn] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({});
  const [newReturn, setNewReturn] = useState<any>({});
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const parseCurrencyAmount = (amountStr: string): number => {
    const cleanAmount = amountStr.replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  };

  const parseDate = (dateStr: string): number => {
    if (!isNaN(Number(dateStr))) {
      return Number(dateStr);
    }
    
    try {
      if (dateStr.includes('-')) {
        const [monthPart, yearPart] = dateStr.split('-');
        let month: number;
        let year: number;
        
        if (isNaN(Number(monthPart))) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          month = monthNames.findIndex(name => monthPart.toLowerCase().startsWith(name.toLowerCase())) + 1;
          year = parseInt(yearPart);
        } else {
          year = parseInt(monthPart);
          month = parseInt(yearPart);
        }
        
        if (month && year) {
          const baselineYear = 2024;
          const baselineMonth = 1;
          return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
        }
      }
      
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
    
    return 1;
  };

  const monthToDate = (month: number): Date => {
    const baselineYear = 2024;
    const baselineMonth = 1;
    
    const totalMonths = month - 1 + baselineMonth - 1;
    const year = baselineYear + Math.floor(totalMonths / 12);
    const monthNum = (totalMonths % 12) + 1;
    
    return new Date(year, monthNum - 1, 1);
  };

  const dateToMonth = (date: Date): number => {
    const baselineYear = 2024;
    const baselineMonth = 1;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
  };

  const parseCsvData = (csvText: string, isReturns = false) => {
    try {
      const lines = csvText.trim().split('\n');
      const newPayments: Payment[] = [];

      lines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length < 3) return;
        
        const [dateOrMonth, ...amountAndDesc] = parts;
        const joinedParts = amountAndDesc.join(',');
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
          amount: Math.abs(amountValue),
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

  const saveNewPayment = () => {
    if (!newPayment.month || !newPayment.amount || !newPayment.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const payment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      month: newPayment.month,
      amount: newPayment.amount,
      description: newPayment.description,
      debtFunded: false
    };

    updatePayments([...projectData.payments, payment]);
    setNewPayment({});
    toast({
      title: "Success",
      description: "Payment added successfully",
    });
  };

  const saveNewReturn = () => {
    if (!newReturn.month || !newReturn.amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const returnItem = {
      month: newReturn.month,
      amount: newReturn.amount,
      type: 'rental' as const
    };

    updateProjectData({ 
      rentalIncome: [...projectData.rentalIncome, returnItem] 
    });
    setNewReturn({});
    toast({
      title: "Success",
      description: "Return added successfully",
    });
  };

  const startEdit = (id: string, payment: Payment, isReturn = false) => {
    if (isReturn) {
      const index = projectData.rentalIncome.findIndex((_, i) => i.toString() === id);
      setEditingReturn(index);
      setEditValues(projectData.rentalIncome[index]);
    } else {
      setEditingPayment(id);
      setEditValues(payment);
    }
  };

  const saveEdit = (isReturn = false) => {
    if (isReturn && editingReturn !== null) {
      const updatedReturns = projectData.rentalIncome.map((item, i) => 
        i === editingReturn ? editValues : item
      );
      updateProjectData({ rentalIncome: updatedReturns });
      setEditingReturn(null);
    } else if (editingPayment) {
      const updatedPayments = projectData.payments.map(payment => 
        payment.id === editingPayment ? { ...editValues, id: editingPayment } : payment
      );
      updatePayments(updatedPayments);
      setEditingPayment(null);
    }
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    setEditingReturn(null);
    setEditValues({});
  };

  const removePayment = (id: string) => {
    updatePayments(projectData.payments.filter(payment => payment.id !== id));
  };

  const removeReturn = (index: number) => {
    const updatedReturns = projectData.rentalIncome.filter((_, i) => i !== index);
    updateProjectData({ rentalIncome: updatedReturns });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit(editingReturn !== null);
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Import Payments (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="csvData">Paste CSV Data</Label>
                  <Textarea
                    id="csvData"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="May-2025,₹1,460,461,On Booking
Jun-2025,₹2,920,922,On Agreement"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add New Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newPayment.month && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPayment.month ? format(monthToDate(newPayment.month), "MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newPayment.month ? monthToDate(newPayment.month) : undefined}
                        onSelect={(date) => date && setNewPayment(prev => ({ ...prev, month: dateToMonth(date) }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={newPayment.amount || ''}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newPayment.description || ''}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Payment description"
                  />
                </div>
                <Button onClick={saveNewPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Payment
                </Button>
              </CardContent>
            </Card>
          </div>

          {projectData.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
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
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Amount (₹)</th>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayments.map((payment, index) => (
                        <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="p-2">
                            {editingPayment === payment.id ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(monthToDate(editValues.month), "MMM yyyy")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={monthToDate(editValues.month)}
                                    onSelect={(date) => date && setEditValues(prev => ({ ...prev, month: dateToMonth(date) }))}
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>{format(monthToDate(payment.month), "MMM yyyy")}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(payment.id, payment)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {editingPayment === payment.id ? (
                              <Input
                                type="number"
                                value={editValues.amount || ''}
                                onChange={(e) => setEditValues(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                onKeyDown={handleKeyPress}
                                className="w-full"
                                autoFocus
                              />
                            ) : (
                              <span>{formatNumber(payment.amount)}</span>
                            )}
                          </td>
                          <td className="p-2">
                            {editingPayment === payment.id ? (
                              <Input
                                value={editValues.description || ''}
                                onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                onKeyDown={handleKeyPress}
                                className="w-full"
                              />
                            ) : (
                              <span>{payment.description}</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {editingPayment === payment.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveEdit(false)}
                                  className="p-1 h-6 w-6 text-green-600"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  className="p-1 h-6 w-6 text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePayment(payment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Import Returns (CSV)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="returnsCsvData">Paste CSV Data</Label>
                  <Textarea
                    id="returnsCsvData"
                    value={returnsCsvData}
                    onChange={(e) => setReturnsCsvData(e.target.value)}
                    placeholder="Jun-2026,₹25,000,Monthly Rent
Mar-2028,₹80,00,000,Property Sale"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add New Return
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newReturn.month && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newReturn.month ? format(monthToDate(newReturn.month), "MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newReturn.month ? monthToDate(newReturn.month) : undefined}
                        onSelect={(date) => date && setNewReturn(prev => ({ ...prev, month: dateToMonth(date) }))}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={newReturn.amount || ''}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>
                <Button onClick={saveNewReturn} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Save Return
                </Button>
              </CardContent>
            </Card>
          </div>

          {projectData.rentalIncome.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
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
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Amount (₹)</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReturns.map((returnItem, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                          <td className="p-2">
                            {editingReturn === index ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(monthToDate(editValues.month), "MMM yyyy")}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={monthToDate(editValues.month)}
                                    onSelect={(date) => date && setEditValues(prev => ({ ...prev, month: dateToMonth(date) }))}
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span>{format(monthToDate(returnItem.month), "MMM yyyy")}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(index.toString(), returnItem, true)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {editingReturn === index ? (
                              <Input
                                type="number"
                                value={editValues.amount || ''}
                                onChange={(e) => setEditValues(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                onKeyDown={handleKeyPress}
                                className="w-full"
                                autoFocus
                              />
                            ) : (
                              <span>{formatNumber(returnItem.amount)}</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {editingReturn === index ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveEdit(true)}
                                  className="p-1 h-6 w-6 text-green-600"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  className="p-1 h-6 w-6 text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeReturn(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
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
