import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Payment, ProjectData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Copy, Calculator } from 'lucide-react';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { exportToCsv } from '@/utils/csvExport';
import { useInterestCalculator } from '@/hooks/useInterestCalculator';
import { monthToDate, dateToMonth, monthToMonth, formatCurrency } from '@/components/payments/utils';

interface PaymentManagerProps {
  projectData: ProjectData;
  updatePayments: (payments: Payment[]) => void;
  interestRate: number;
  onCalculateInterest: () => void;
  allEntriesForTable: Payment[];
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({
  projectData,
  updatePayments,
  interestRate,
  onCalculateInterest,
  allEntriesForTable,
}) => {
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const { toast } = useToast();

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    month: dateToMonth(new Date()),
    amount: 0,
    description: '',
    date: new Date(),
    type: 'payment',
  });

  // Handle editing payment
  const startEditPayment = useCallback((payment: Payment) => {
    if (payment.type === 'interest') return; // Don't allow editing interest entries
    
    setEditingPayment(payment.id || null);
    setEditValues({
      month: payment.month,
      amount: payment.amount,
      description: payment.description || '',
      type: payment.type,
    });
  }, []);

  // Handle saving edited payment
  const saveEdit = useCallback(() => {
    if (!editingPayment) return;
    
    const updatedPayments = projectData.payments.map(payment => {
      if (payment.id === editingPayment) {
        return {
          ...payment,
          ...editValues,
          amount: Number(editValues.amount),
        };
      }
      return payment;
    });
    
    updatePayments(updatedPayments);
    setEditingPayment(null);
    setEditValues({});
  }, [editingPayment, editValues, projectData.payments, updatePayments]);

  // Handle canceling edit
  const cancelEdit = useCallback(() => {
    setEditingPayment(null);
    setEditValues({});
  }, []);

  // Handle removing payment
  const removePayment = useCallback((id: string) => {
    updatePayments(projectData.payments.filter(payment => payment.id !== id));
  }, [projectData.payments, updatePayments]);

  // Handle saving new payment
  const handleSaveNew = useCallback(() => {
    console.log('=== handleSaveNew STARTED ===');
    console.log('Current newPayment:', newPayment);
    console.log('Current projectData.payments:', projectData.payments);
    
    if (!newPayment.amount || newPayment.amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Determine the payment type, default to 'payment' if not set
    const paymentType = (newPayment.type === 'return' || newPayment.type === 'payment') 
      ? newPayment.type 
      : 'payment';
    
    // Create a new payment with a unique ID that includes the type
    const payment: Payment = {
      id: `${paymentType}-${Date.now()}`,
      month: newPayment.month || dateToMonth(new Date()),
      amount: Math.abs(newPayment.amount), // Store absolute value
      description: newPayment.description || '',
      date: newPayment.date || monthToDate(newPayment.month || dateToMonth(new Date())),
      type: paymentType,
    };
    
    console.log('Created new payment:', payment);

    // Update the payments in the parent component
    updatePayments([...projectData.payments, payment]);
    
    // Reset the form
    setNewPayment({
      month: dateToMonth(new Date()),
      amount: 0,
      description: '',
      date: new Date(),
      type: 'payment',
    });
    
    // Close the add new row
    setIsAddingNew(false);
    
    // Show success message
    toast({
      title: `${paymentType === 'return' ? 'Return' : 'Payment'} Added`,
      description: `New ${paymentType} entry has been added successfully. Click 'Calculate Interest' to update interest calculations.`,
    });
  }, [newPayment, projectData.payments, updatePayments, toast, dateToMonth, monthToDate]);

  // Handle canceling new payment
  const handleCancelNew = useCallback(() => {
    setIsAddingNew(false);
    setNewPayment({
      month: dateToMonth(new Date()),
      amount: 0,
      description: '',
      date: new Date(),
      type: 'payment',
    });
  }, []);

  // Parse CSV data and add to payments
  const parseCsvData = useCallback(() => {
    try {
      const lines = csvData.trim().split('\n');
      const newPayments: Payment[] = [];

      lines.forEach((line, index) => {
        const [monthOrDate, amount, description = ''] = line.split(',').map(s => s.trim());
        
        if (!monthOrDate || !amount) return;

        let month: string;
        let date: Date;
        
        // Try to parse as date first
        const parsedDate = new Date(monthOrDate);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
          month = dateToMonth(date);
        } else {
          // Try to parse as month string (e.g., "May-2024")
          const [monthName, year] = monthOrDate.split('-');
          if (monthName && year) {
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              .findIndex(m => m.toLowerCase() === monthName.substring(0, 3).toLowerCase());
            if (monthIndex !== -1) {
              date = new Date(parseInt(year), monthIndex, 1);
              month = dateToMonth(date);
            } else {
              throw new Error(`Invalid date/month format at line ${index + 1}`);
            }
          } else {
            throw new Error(`Invalid date/month format at line ${index + 1}`);
          }
        }

        // Parse amount (remove any currency symbols and commas)
        const amountValue = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
        if (isNaN(amountValue)) {
          throw new Error(`Invalid amount at line ${index + 1}`);
        }

        // Determine type based on amount sign (negative = payment, positive = return)
        const type: 'payment' | 'return' = amountValue < 0 ? 'payment' : 'return';

        newPayments.push({
          id: `imported-${Date.now()}-${index}`,
          month,
          amount: Math.abs(amountValue),
          description: description || `Imported payment ${index + 1}`,
          date: date || monthToMonth(month),
          type,
        });
      });

      if (newPayments.length > 0) {
        // Update payments without triggering analysis
        updatePayments([...projectData.payments, ...newPayments]);
        setCsvData('');
        setIsImportOpen(false);
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${newPayments.length} payment(s). Click 'Refresh' in the Analysis tab to update metrics.`,
        });
      }
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      toast({
        title: 'Import Error',
        description: error instanceof Error ? error.message : 'Failed to parse CSV data',
        variant: 'destructive',
      });
    }
  }, [csvData, projectData.payments, toast, updatePayments]);

  // Handle CSV export
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
      
      // Fallback to download if clipboard API is not available
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
              onClick={(e) => {
                console.log('Calculate Interest button clicked');
                console.log('onCalculateInterest:', onCalculateInterest);
                onCalculateInterest();
              }}
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
          formatNumber={(n: number) => new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
          }).format(n)}
          monthToDate={monthToDate}
          dateToMonth={dateToMonth}
          isAddingNew={isAddingNew}
          newPayment={newPayment}
          setNewPayment={setNewPayment}
          onSaveNew={handleSaveNew}
          onCancelNew={handleCancelNew}
        />
      </div>

      {/* Import Modal - You'll need to implement this or keep from original */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsImportOpen(false)}>
          <div className="relative max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <Card className="border-blue-200 shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">Import CSV</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Paste your CSV data here. Format: Month,Amount,Description
                </p>
                <textarea
                  className="w-full p-2 border rounded mb-2 h-32"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="May-2024,-1000000,Initial payment"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={parseCsvData}>
                    Import
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
