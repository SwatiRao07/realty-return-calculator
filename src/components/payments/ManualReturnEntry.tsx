
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TableRow, TableCell } from '@/components/ui/table';
import { IncomeItem } from '@/types/project';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface ManualReturnEntryProps {
  isAddingNew: boolean;
  newReturn: Partial<IncomeItem>;
  setNewReturn: (returnItem: Partial<IncomeItem>) => void;
  onSaveNew: () => void;
  onCancelNew: () => void;
  monthToDate: (month: number) => Date;
  dateToMonth: (date: Date) => number;
}

export const ManualReturnEntry: React.FC<ManualReturnEntryProps> = ({
  isAddingNew,
  newReturn,
  setNewReturn,
  onSaveNew,
  onCancelNew,
  monthToDate,
  dateToMonth
}) => {
  if (!isAddingNew) return null;

  return (
    <TableRow className="bg-green-50">
      <TableCell className="p-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left font-normal text-sm h-8"
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {newReturn.month !== undefined ? format(monthToDate(newReturn.month), "MMM yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align="start"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={newReturn.date ? new Date(newReturn.date) : (newReturn.month !== undefined ? monthToDate(newReturn.month) : new Date())}
              onSelect={(date) => {
                if (date) {
                  setNewReturn({
                    ...newReturn,
                    date,
                    month: dateToMonth(date)
                  });
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                }
              }}
              className="rounded-md border"
              initialFocus
            />
            <div className="flex justify-end p-2 border-t">
              <Button variant="outline" size="sm" className="h-8">
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="p-1">
        <Input
          type="number"
          value={newReturn.amount || ''}
          onChange={(e) => setNewReturn({
            ...newReturn,
            amount: Number(e.target.value)
          })}
          className="h-8"
          placeholder="Amount"
        />
      </TableCell>
      <TableCell className="p-1">
        <div className="flex justify-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={onSaveNew}
            disabled={!newReturn.amount || newReturn.month === undefined}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={onCancelNew}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
