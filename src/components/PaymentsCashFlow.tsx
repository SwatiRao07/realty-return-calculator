
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Payment, ProjectData, IncomeItem } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { CashFlowAnalysis } from '@/components/CashFlowAnalysis';
import { CsvImport } from '@/components/payments/CsvImport';
import { ManualPaymentEntry } from '@/components/payments/ManualPaymentEntry';
import { ManualReturnEntry } from '@/components/payments/ManualReturnEntry';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { ReturnsTable } from '@/components/payments/ReturnsTable';
import { 
  formatCurrency, 
  formatNumber, 
  parseCurrencyAmount, 
  parseDate, 
  monthToDate, 
  dateToMonth 
} from '@/components/payments/utils';

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
  const [newReturn, setNewReturn] = useState<Partial<IncomeItem>>({});
  const { toast } = useToast();

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
    if (!newPayment.month || !newPayment.amount) {
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
      description: newPayment.description || `Payment ${newPayment.month}`,
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

    const returnItem: IncomeItem = {
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

  const startEditPayment = (id: string, payment: Payment) => {
    setEditingPayment(id);
    setEditValues(payment);
  };

  const startEditReturn = (index: number, returnItem: IncomeItem) => {
    setEditingReturn(index);
    setEditValues(returnItem);
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

  return (
    <div className="space-y-4 p-4">
      <Tabs defaultValue="payments" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payments & Returns</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-3">
          <CsvImport
            csvData={csvData}
            setCsvData={setCsvData}
            returnsCsvData={returnsCsvData}
            setReturnsCsvData={setReturnsCsvData}
            onImportPayments={() => parseCsvData(csvData, false)}
            onImportReturns={() => parseCsvData(returnsCsvData, true)}
          />

          <div className="grid gap-3 lg:grid-cols-2">
            <ManualPaymentEntry
              newPayment={newPayment}
              setNewPayment={setNewPayment}
              onSave={saveNewPayment}
              monthToDate={monthToDate}
              dateToMonth={dateToMonth}
            />

            <ManualReturnEntry
              newReturn={newReturn}
              setNewReturn={setNewReturn}
              onSave={saveNewReturn}
              monthToDate={monthToDate}
              dateToMonth={dateToMonth}
            />
          </div>

          <PaymentsTable
            payments={projectData.payments}
            editingPayment={editingPayment}
            editValues={editValues}
            onStartEdit={startEditPayment}
            onSaveEdit={() => saveEdit(false)}
            onCancelEdit={cancelEdit}
            onRemove={removePayment}
            setEditValues={setEditValues}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            monthToDate={monthToDate}
            dateToMonth={dateToMonth}
          />

          <ReturnsTable
            returns={projectData.rentalIncome}
            editingReturn={editingReturn}
            editValues={editValues}
            onStartEdit={startEditReturn}
            onSaveEdit={() => saveEdit(true)}
            onCancelEdit={cancelEdit}
            onRemove={removeReturn}
            setEditValues={setEditValues}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            monthToDate={monthToDate}
            dateToMonth={dateToMonth}
          />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowAnalysis projectData={projectData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
