
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IncomeItem } from '@/types/project';
import { Trash2, CalendarIcon, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface ReturnsTableProps {
  returns: IncomeItem[];
  editingReturn: number | null;
  editValues: any;
  onStartEdit: (index: number, returnItem: IncomeItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (index: number) => void;
  setEditValues: (values: any) => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  monthToDate: (month: number) => Date;
  dateToMonth: (date: Date) => number;
}

export const ReturnsTable: React.FC<ReturnsTableProps> = ({
  returns,
  editingReturn,
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

  const sortedReturns = [...returns].sort((a, b) => a.month - b.month);
  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  if (returns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Returns Schedule ({returns.length} returns)</span>
          <span className="text-lg font-bold text-green-600">
            Total: {formatCurrency(totalReturns)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReturns.map((returnItem, index) => (
              <TableRow key={index}>
                <TableCell className="p-1">
                  {editingReturn === index ? (
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
                      <span className="text-sm">{format(monthToDate(returnItem.month), "MMM yyyy")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onStartEdit(index, returnItem)}
                        className="p-1 h-6 w-6"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell className="p-1">
                  {editingReturn === index ? (
                    <Input
                      type="number"
                      value={editValues.amount || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      onKeyDown={handleKeyPress}
                      className="w-full h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm">{formatNumber(returnItem.amount)}</span>
                  )}
                </TableCell>
                <TableCell className="p-1 text-center">
                  {editingReturn === index ? (
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
                      onClick={() => onRemove(index)}
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
