
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { TableRow, TableCell } from '@/components/ui/table';
import { Payment } from '@/types/project';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface ManualPaymentEntryProps {
  isAddingNew: boolean;
  newPayment: Partial<Payment>;
  setNewPayment: (payment: Partial<Payment>) => void;
  onSaveNew: () => void;
  onCancelNew: () => void;
  monthToDate: (month: number) => Date;
  dateToMonth: (date: Date) => number;
}

export const ManualPaymentEntry: React.FC<ManualPaymentEntryProps> = ({
  isAddingNew,
  newPayment,
  setNewPayment,
  onSaveNew,
  onCancelNew,
  monthToDate,
  dateToMonth
}) => {
  if (!isAddingNew) return null;

  return (
    <TableRow className="bg-blue-50 border-t border-blue-100">
      <TableCell className="p-1 pt-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left font-normal text-xs h-8 border-blue-200 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3 text-blue-500" />
              {newPayment.date ? format(new Date(newPayment.date), "MMM d, yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <EnhancedCalendar
              mode="single"
              selected={newPayment.date ? new Date(newPayment.date) : (newPayment.month ? monthToDate(newPayment.month) : new Date())}
              onSelect={(date) => {
                if (date) {
                  setNewPayment({
                    ...newPayment,
                    date,
                    month: dateToMonth(date)
                  });
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                }
              }}
              className="rounded-md border"
              initialFocus
              yearRange={{ from: 2023, to: 2030 }}
            />
            <div className="flex justify-end p-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
              >
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="p-1 pt-2">
        <Input
          type="number"
          value={newPayment.amount || ''}
          onChange={(e) => setNewPayment({
            ...newPayment,
            amount: Math.abs(Number(e.target.value))
          })}
          className="h-8 text-xs border-blue-200 bg-white"
          placeholder="Amount"
        />
      </TableCell>
      <TableCell className="p-1 pt-2">
        <select
          value={newPayment.type || 'payment'}
          onChange={(e) => setNewPayment({
            ...newPayment,
            type: e.target.value as 'payment' | 'return'
          })}
          className="w-full h-8 text-xs rounded-md border border-blue-200 px-2 bg-white"
        >
          <option value="payment">Payment</option>
          <option value="return">Return</option>
        </select>
      </TableCell>
      <TableCell className="p-1 pt-2">
        <Input
          value={newPayment.description || ''}
          onChange={(e) => setNewPayment({
            ...newPayment,
            description: e.target.value
          })}
          className="h-8 text-xs border-blue-200 bg-white"
          placeholder="Description"
        />
      </TableCell>
      <TableCell className="p-1 pt-2"></TableCell>
      <TableCell className="p-1 pt-2 text-right">
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveNew}
            className="p-1 h-7 w-7 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
            title="Save entry"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelNew}
            className="p-1 h-7 w-7 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
