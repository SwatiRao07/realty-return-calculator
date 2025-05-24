
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Payment } from '@/types/project';
import { Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ManualPaymentEntryProps {
  newPayment: Partial<Payment>;
  setNewPayment: (payment: Partial<Payment>) => void;
  onSave: () => void;
  monthToDate: (month: number) => Date;
  dateToMonth: (date: Date) => number;
}

export const ManualPaymentEntry: React.FC<ManualPaymentEntryProps> = ({
  newPayment,
  setNewPayment,
  onSave,
  monthToDate,
  dateToMonth
}) => {
  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add New Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
        <Button onClick={onSave} className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Save Payment
        </Button>
      </CardContent>
    </Card>
  );
};
