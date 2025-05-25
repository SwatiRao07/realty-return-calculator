import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Payment, IncomeItem, ProjectData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { CashFlowAnalysis } from '@/components/CashFlowAnalysis';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { Plus, ArrowUpDown, X, Upload, Copy, Percent, Calculator } from 'lucide-react'; 
import { exportToCsv } from '@/utils/csvExport';
import { format, endOfMonth } from 'date-fns'; 
import { 
  formatCurrency, 
  formatNumber, 
  parseCurrencyAmount, 
  parseDate, 
  monthToDate, 
  dateToMonth 
} from '@/components/payments/utils';
import { calculateMonthlyInterestLogic, CalculatedInterestResult } from '@/utils/interestCalculator'; 
import { calculateDerivedProjectEndDate } from '@/utils/projectDateUtils'; 

interface PaymentsCashFlowProps {
  projectData: ProjectData;
  updateProjectData: (updates: Partial<ProjectData>) => void;
  updatePayments: (payments: Payment[]) => void;
  showOnlyCashFlow?: boolean;
  showOnlyAnalysis?: boolean;
}

const PaymentsCashFlow: React.FC<PaymentsCashFlowProps> = ({ 
  projectData, 
  updateProjectData, 
  updatePayments,
  showOnlyCashFlow = false,
  showOnlyAnalysis = false
}): JSX.Element => {
  const [csvData, setCsvData] = useState('');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [interestRate, setInterestRate] = useState<number>(projectData.annualInterestRate || 12); 
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    month: dateToMonth(new Date()),
    amount: 0,
    description: '',
    date: new Date(), 
    type: 'payment',
  });
  const { toast } = useToast();

  const [currentInterestDetails, setCurrentInterestDetails] = useState<CalculatedInterestResult | null>(null);

  // Only clear interest details when core payment data changes, NOT when switching tabs
  useEffect(() => {
    setCurrentInterestDetails(null);
  }, [projectData.payments, projectData.rentalIncome, interestRate]);

  const projectEndDate = useMemo(() => {
    const allNonInterestEntries = [
      ...projectData.payments.map(p => ({ ...p, date: p.date ? new Date(p.date) : monthToDate(p.month) })),
      ...projectData.rentalIncome.map(r => ({ ...r, date: r.date ? new Date(r.date) : monthToDate(r.month) }))
    ];
    return calculateDerivedProjectEndDate(allNonInterestEntries as Payment[]); 
  }, [projectData.payments, projectData.rentalIncome]);

  const handleCalculateInterest = useCallback(() => {
    // Validation check
    if (interestRate <= 0 && projectData.payments.length === 0) {
      toast({
        title: 'No Interest to Calculate',
        description: 'Interest rate is 0 or no payments exist.',
      });
      return;
    }
    
    console.log('Calculating interest with rate:', interestRate);
    
    // Calculate new interest payments
    const result = calculateMonthlyInterestLogic({
      payments: projectData.payments,
      interestRate: interestRate,
      projectEndDate: projectEndDate || undefined,
    });
    
    if (result.error) {
      toast({
        title: 'Interest Calculation Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }
    
    // Simple approach: Remove ALL existing interest entries
    const nonInterestPayments = projectData.payments.filter(p => p.type !== 'interest');
    
    // Add new interest entries (already stored as negative values)
    const newInterestPayments = result.newInterestPayments;
    
    // Combine regular payments with new interest entries
    const updatedPayments = [...nonInterestPayments, ...newInterestPayments];
    
    // Update both local state and parent component
    setCurrentInterestDetails({
      newInterestPayments,
      allPaymentsWithInterest: updatedPayments,
      finalBalance: result.finalBalance
    });
    
    // Save to parent component state so it persists between tabs
    updatePayments(updatedPayments);
    
    toast({
      title: 'Interest Calculated',
      description: `${newInterestPayments.length} interest entries created. All data saved.`,
    });
  }, [projectData.payments, interestRate, projectEndDate, toast, updatePayments]);
  
  // Get all payments with interest for analysis - simplified to use parent component state
  const allPaymentsWithInterest = useMemo(() => {
    return projectData.payments;
  }, [projectData.payments]);

  const allEntriesForTable: Payment[] = useMemo(() => {
    const principalPaymentsMapped: Payment[] = projectData.payments.map((p: Payment): Payment => ({
      ...p,
      id: p.id || `payment_${p.month}_${p.amount}_${Math.random()}`,
      date: p.date ? (typeof p.date === 'string' ? p.date : new Date(p.date).toISOString()) : monthToDate(p.month).toISOString(),
      type: p.type || 'payment',
    }));

    const interestPaymentsMapped: Payment[] = currentInterestDetails?.newInterestPayments.map((p: Payment): Payment => ({
      ...p,
      date: p.date ? (typeof p.date === 'string' ? p.date : new Date(p.date).toISOString()) : monthToDate(p.month).toISOString(),
    })) || [];

    const returnsMapped: Payment[] = projectData.rentalIncome.map((r: IncomeItem, i: number): Payment => ({
      id: r.id || `return_${i}_${r.month}_${r.amount}`,
      month: r.month,
      amount: r.amount,
      description: r.description || (r.type === 'sale' ? 'Property Sale' : 'Rental Income'),
      date: r.date ? (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString()) : monthToDate(r.month).toISOString(),
      type: 'return',
      debtFunded: undefined,
    }));

    return [...principalPaymentsMapped, ...interestPaymentsMapped, ...returnsMapped].sort((a, b) => {
      const dateA = new Date(a.date as string).getTime();
      const dateB = new Date(b.date as string).getTime();
      if (dateA === dateB) {
        const typeOrder = { payment: 1, interest: 2, return: 3 };
        return (typeOrder[a.type as keyof typeof typeOrder] || 99) - (typeOrder[b.type as keyof typeof typeOrder] || 99);
      }
      return dateA - dateB;
    });
  }, [projectData.payments, projectData.rentalIncome, currentInterestDetails?.newInterestPayments]);

  const allEntriesForCSV: Payment[] = useMemo(() => {
    const paymentsMapped: Payment[] = projectData.payments.map((p: Payment): Payment => ({
      ...p,
      id: p.id || `payment_${p.month}_${p.amount}_${Math.random()}`,
      date: p.date ? (typeof p.date === 'string' ? p.date : new Date(p.date).toISOString()) : monthToDate(p.month).toISOString(),
      type: p.type || 'payment', 
    }));

    const returnsMapped: Payment[] = projectData.rentalIncome.map((r: IncomeItem, i: number): Payment => ({
      id: r.id || `return_${i}_${r.month}_${r.amount}`,
      month: r.month,
      amount: r.amount,
      description: r.description || (r.type === 'sale' ? 'Property Sale' : 'Rental Income'),
      date: r.date ? (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString()) : monthToDate(r.month).toISOString(),
      type: 'return',
      debtFunded: undefined, 
    }));

    return [...paymentsMapped, ...returnsMapped].sort((a, b) => {
      const dateA = new Date(a.date as string).getTime();
      const dateB = new Date(b.date as string).getTime();
      return dateA - dateB;
    });
  }, [projectData.payments, projectData.rentalIncome]);

  const handleCopyCSV = useCallback(async () => {
    try {
      const csvContent = exportToCsv(allEntriesForTable); 
      await navigator.clipboard.writeText(csvContent);
      
      toast({
        title: 'CSV Copied',
        description: 'Cash flow data has been copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy CSV to clipboard',
        variant: 'destructive',
      });
    }
  }, [allEntriesForTable, toast]);

  const parseCashFlowData = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      const hasHeader = lines[0].toLowerCase().includes('date') && 
                      lines[0].toLowerCase().includes('amount') && 
                      (lines[0].toLowerCase().includes('comment') || lines[0].toLowerCase().includes('description'));
      
      const dataLines = hasHeader ? lines.slice(1) : lines;
      const newPayments: Payment[] = [];
      const newReturns: IncomeItem[] = [];

      dataLines.forEach((line, index) => {
        if (!line.trim()) return; 
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 2) return; 
        
        const dateOrMonth = parts[0];
        const amount = parts[1];
        const description = parts.slice(2).join(', ').trim();
        
        if (!dateOrMonth || !amount) return;

        try {
          const month = parseDate(dateOrMonth);
          const amountValue = parseCurrencyAmount(amount);
          const date = new Date();
          date.setMonth(month % 12);
          date.setFullYear(Math.floor(month / 12));
          const dateString = date.toISOString();
          
          if (amountValue < 0) {
            newPayments.push({
              id: Math.random().toString(36).substr(2, 9),
              month: month,
              amount: Math.abs(amountValue),
              description: description || `Payment ${month}`,
              debtFunded: false,
              date: dateString,
              type: 'payment' as const
            });
          } else {
            newReturns.push({
              month: month,
              amount: amountValue,
              type: 'rental' as const,
              date: dateString,
              description: description || `Return ${month}`
            });
          }
        } catch (error) {
          console.error(`Error processing line ${index + 1}:`, line, error);
          toast({
            title: `Error processing line ${index + 1}`,
            description: `Skipping invalid entry: ${line}`,
            variant: 'destructive'
          });
        }
      });

      if (newPayments.length > 0 || newReturns.length > 0) {
        updatePayments([...projectData.payments, ...newPayments]);
        updateProjectData({ 
          rentalIncome: [...projectData.rentalIncome, ...newReturns] 
        });
        setCurrentInterestDetails(null); // Clear existing interest
        setCsvData('');

        toast({
          title: "Import Successful",
          description: `Imported ${newPayments.length} payments and ${newReturns.length} returns successfully`,
        });
      } else {
        toast({
          title: "No Valid Data",
          description: "No valid payment or return entries were found in the CSV data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV data",
        variant: "destructive",
      });
    }
  };

  const startEditPayment = (id: string, payment: Payment) => {
    setEditingPayment(id);
    setEditValues(payment);
  };

  const saveEdit = () => {
    if (editingPayment) {
      if (editingPayment.startsWith('return_')) {
        const returnIndex = parseInt(editingPayment.split('_')[1]);
        if (!isNaN(returnIndex) && returnIndex >= 0 && returnIndex < projectData.rentalIncome.length) {
          const updatedReturns = [...projectData.rentalIncome];
          updatedReturns[returnIndex] = {
            month: editValues.month,
            amount: Math.abs(Number(editValues.amount)), 
            type: 'rental' as const,
            date: editValues.date,
            description: editValues.description
          };
          updateProjectData({ rentalIncome: updatedReturns });
        }
      } else if (editValues.type === 'return') {
        const newReturn: IncomeItem = {
          month: editValues.month,
          amount: Math.abs(Number(editValues.amount)), 
          type: 'rental' as const,
          date: editValues.date,
          description: editValues.description
        };
        const updatedReturns = [...projectData.rentalIncome, newReturn];
        updateProjectData({ rentalIncome: updatedReturns });
        
        if (editingPayment !== 'new') {
          updatePayments(projectData.payments.filter(payment => payment.id !== editingPayment));
        }
      } else {
        const updatedPayments = projectData.payments.map(payment => 
          payment.id === editingPayment ? { 
            ...editValues, 
            id: editingPayment,
            amount: Math.abs(Number(editValues.amount)) 
          } : payment
        );
        updatePayments(updatedPayments);
      }
      setEditingPayment(null);
    } else if (editValues.id === 'new') {
      if (editValues.type === 'return') {
        const newReturn: IncomeItem = {
          month: editValues.month,
          amount: Math.abs(Number(editValues.amount)), 
          type: 'rental' as const,
          date: editValues.date,
          description: editValues.description
        };
        const updatedReturns = [...projectData.rentalIncome, newReturn];
        updateProjectData({ rentalIncome: updatedReturns });
      } else {
        const newPayment: Payment = {
          ...editValues,
          id: Math.random().toString(36).substr(2, 9),
          amount: Math.abs(Number(editValues.amount)) 
        };
        updatePayments([...projectData.payments, newPayment]);
      }
    }
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    setEditValues({});
  };

  const handleSaveNew = () => {
    if (newPayment.amount && newPayment.description && newPayment.date) {
      const date = new Date(newPayment.date);
      const month = dateToMonth(date);
      
      if (newPayment.type === 'return') {
        const newReturn: IncomeItem = {
          month,
          amount: Math.abs(Number(newPayment.amount)), 
          type: 'rental' as const,
          date: date.toISOString(),
          description: newPayment.description
        };
        updateProjectData({ 
          rentalIncome: [...projectData.rentalIncome, newReturn] 
        });
      } else {
        const payment: Payment = {
          id: Math.random().toString(36).substr(2, 9),
          month,
          amount: Math.abs(Number(newPayment.amount)),
          description: newPayment.description,
          date: date.toISOString(),
          type: 'payment',
          debtFunded: false
        };
        updatePayments([...projectData.payments, payment]);
      }
      
      setNewPayment({
        month: dateToMonth(new Date()),
        amount: 0,
        description: '',
        date: new Date(),
        type: 'payment',
      });
      setIsAddingNew(false);
      
      toast({
        title: "Entry Added",
        description: `New ${newPayment.type} has been added successfully`,
      });
    }
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewPayment({
      month: dateToMonth(new Date()),
      amount: 0,
      description: '',
      date: new Date(),
      type: 'payment',
    });
  };

  const removePayment = (id: string) => {
    if (id.startsWith('return_')) {
      const returnIndex = parseInt(id.split('_')[1]);
      if (!isNaN(returnIndex) && returnIndex >= 0 && returnIndex < projectData.rentalIncome.length) {
        const updatedReturns = [...projectData.rentalIncome];
        updatedReturns.splice(returnIndex, 1);
        updateProjectData({ rentalIncome: updatedReturns });
      }
    } else {
      updatePayments(projectData.payments.filter(payment => payment.id !== id));
    }
  };

  const handleExportCSV = useCallback(async () => {
    try {
      const entries = allEntriesForTable.map(entry => ({
        ...entry,
        date: entry.date || monthToDate(entry.month).toISOString()
      }));
      
      const csvContent = exportToCsv(entries);
      
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(csvContent);
          toast({
            title: 'CSV Copied',
            description: 'Cash flow data has been copied to clipboard',
          });
          return; 
        } catch (clipboardError) {
          console.warn('Clipboard write failed, falling back to download:', clipboardError);
        }
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'cash-flow-export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'CSV Downloaded',
        description: 'Cash flow data has been downloaded as cash-flow-export.csv',
      });
      
    } catch (error) {
      console.error('Error in handleExportCSV:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export CSV. Please try again or contact support.',
        variant: 'destructive',
      });
    }
  }, [allEntriesForTable, toast]);

  return (
    <div className="space-y-4">
      {(showOnlyCashFlow || (!showOnlyCashFlow && !showOnlyAnalysis)) && (
        <div className="space-y-3">
          <div className="flex justify-end items-center px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
              >
                <Copy className="h-3.5 w-3.5" />
                Export CSV 
              </Button>
              <Button
                onClick={handleCalculateInterest}
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
              >
                <Calculator className="h-3.5 w-3.5" />
                Calculate Interest
              </Button>
              <Button
                onClick={() => setIsImportOpen(true)}
                variant="outline"
                size="sm"
                className="h-8 gap-1 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
              >
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
              <Button
                onClick={() => setIsAddingNew(true)}
                variant="outline"
                size="sm"
                className="h-8 gap-1 ml-auto bg-primary-50 border-primary-200 hover:bg-primary-100 text-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Entry
              </Button>
            </div>
          </div>

          <PaymentsTable
            payments={allEntriesForTable} 
            editingPayment={editingPayment}
            editValues={editValues}
            onStartEdit={startEditPayment}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onRemove={removePayment}
            setEditValues={setEditValues}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            monthToDate={monthToDate}
            dateToMonth={dateToMonth}
            isAddingNew={isAddingNew}
            newPayment={newPayment}
            setNewPayment={setNewPayment}
            onSaveNew={handleSaveNew}
            onCancelNew={handleCancelNew}
          />
        </div>
      )}

      {showOnlyAnalysis && (
        <div className="space-y-3">
          <CashFlowAnalysis 
            projectData={projectData} 
            allPaymentsWithInterest={allPaymentsWithInterest} 
            projectEndDate={projectEndDate}
          />
        </div>
      )}

      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsImportOpen(false)}>
          <div className="relative max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="pb-1 pt-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-blue-600" />
                    Import Cash Flow Data
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-full"
                    onClick={() => setIsImportOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-2">
                <div>
                  <Textarea
                    id="csvData"
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="May-2025,-₹1,460,461,On Booking (payment)\nJun-2026,₹25,000,Monthly Rent (return)"
                    rows={4}
                    className="font-mono text-xs mb-1 focus:border-blue-300"
                  />
                  <div className="text-xs text-gray-500 mb-2 flex items-center">
                    <span className="text-blue-500 mr-1">ⓘ</span> 
                    <span>Negative amounts = payments, positive = returns</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      parseCashFlowData(csvData);
                      setIsImportOpen(false);
                    }} 
                    disabled={!csvData.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 h-8"
                    type="button"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsCashFlow;
