
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Payment } from '@/types/project';
import { Trash2, CalendarIcon, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentsTableProps {
  payments: Payment[];
  editingPayment: string | null;
  editValues: any;
  onStartEdit: (id: string, payment: Payment) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (id: string) => void;
  setEditValues: (values: any) => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  monthToDate: (month: number) => Date;
  dateToMonth: (date: Date) => number;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  payments,
  editingPayment,
  editValues,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  setEditValues,
  formatCurrency,
  formatNumber,
  monthToDate,
  dateToMonth
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const sortedPayments = [...payments].sort((a, b) => a.month - b.month);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  if (payments.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Payment Schedule ({payments.length} payments)</span>
          <span className="text-lg font-bold text-red-600">
            Total: {formatCurrency(totalPayments)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayments.map((payment, index) => (
              <TableRow key={payment.id}>
                <TableCell className="p-1">
                  {editingPayment === payment.id ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-8">
                          <CalendarIcon className="mr-2 h-3 w-3" />
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
                      <span className="text-sm">{format(monthToDate(payment.month), "MMM yyyy")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartEdit(payment.id, payment)}
                        className="p-1 h-6 w-6"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-1">
                  {editingPayment === payment.id ? (
                    <Input
                      type="number"
                      value={editValues.amount || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      onKeyDown={handleKeyPress}
                      className="w-full h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm">{formatNumber(payment.amount)}</span>
                  )}
                </TableCell>
                <TableCell className="p-1">
                  {editingPayment === payment.id ? (
                    <Input
                      value={editValues.description || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                      onKeyDown={handleKeyPress}
                      className="w-full h-8 text-sm"
                    />
                  ) : (
                    <span className="text-sm">{payment.description}</span>
                  )}
                </TableCell>
                <TableCell className="p-1 text-center">
                  {editingPayment === payment.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSaveEdit}
                        className="p-1 h-6 w-6 text-green-600"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancelEdit}
                        className="p-1 h-6 w-6 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(payment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
