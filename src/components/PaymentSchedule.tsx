
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Payment } from '@/types/project';
import { Upload, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentScheduleProps {
  payments: Payment[];
  updatePayments: (payments: Payment[]) => void;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({ payments, updatePayments }) => {
  const [csvData, setCsvData] = useState('');
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const parseCsvData = () => {
    try {
      const lines = csvData.trim().split('\n');
      const newPayments: Payment[] = [];

      lines.forEach((line, index) => {
        const [monthOrDate, amount, description = '', debtFunded = ''] = line.split(',').map(s => s.trim());
        
        if (!monthOrDate || !amount) return;

        let month: number;
        
        // Try to parse as month number first
        if (!isNaN(Number(monthOrDate))) {
          month = Number(monthOrDate);
        } else {
          // Try to parse as date
          const date = new Date(monthOrDate);
          if (!isNaN(date.getTime())) {
            // Calculate month difference from a baseline (you can adjust this)
            const baseline = new Date('2024-01-01');
            month = Math.ceil((date.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24 * 30));
          } else {
            throw new Error(`Invalid date/month format at line ${index + 1}`);
          }
        }

        newPayments.push({
          id: Math.random().toString(36).substr(2, 9),
          month: month,
          amount: Number(amount),
          description: description || `Payment ${month}`,
          debtFunded: debtFunded.toLowerCase() === 'true' || debtFunded === '1'
        });
      });

      updatePayments([...payments, ...newPayments]);
      setCsvData('');
      toast({
        title: "Success",
        description: `Imported ${newPayments.length} payments successfully`,
      });
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to parse CSV data",
        variant: "destructive",
      });
    }
  };

  const addManualPayment = () => {
    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      month: 1,
      amount: 0,
      description: 'New Payment',
      debtFunded: false
    };
    updatePayments([...payments, newPayment]);
  };

  const updatePayment = (id: string, field: keyof Payment, value: any) => {
    const updatedPayments = payments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    );
    updatePayments(updatedPayments);
  };

  const removePayment = (id: string) => {
    updatePayments(payments.filter(payment => payment.id !== id));
  };

  const sortedPayments = [...payments].sort((a, b) => a.month - b.month);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              CSV Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csvData">Paste CSV Data</Label>
              <Textarea
                id="csvData"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Month,Amount,Description,DebtFunded
1,500000,Initial Payment,true
3,750000,Progress Payment,true
6,1000000,Completion Payment,false"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: Month/Date, Amount, Description (optional), DebtFunded (true/false)
              </p>
            </div>
            <Button 
              onClick={parseCsvData} 
              disabled={!csvData.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
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
              onClick={addManualPayment}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Month: Project month number (1, 2, 3...)</p>
              <p>• Amount: Payment amount in INR</p>
              <p>• Debt Funded: Whether this payment requires financing</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payment Schedule ({payments.length} payments)</span>
              <span className="text-lg font-bold text-green-600">
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
                    <th className="text-center p-3 font-medium">Debt Funded</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPayments.map((payment, index) => (
                    <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={payment.month}
                          onChange={(e) => updatePayment(payment.id, 'month', Number(e.target.value))}
                          className="w-20"
                          min="1"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={payment.amount}
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
                        <Checkbox
                          checked={payment.debtFunded || false}
                          onCheckedChange={(checked) => updatePayment(payment.id, 'debtFunded', checked)}
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
    </div>
  );
};
