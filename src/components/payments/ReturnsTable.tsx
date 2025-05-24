
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IncomeItem } from '@/types/project';
import { Trash2, CalendarIcon, Pencil, Check, X, Plus } from 'lucide-react';
import { format, addMonths } from 'date-fns';

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
  monthToDate: propMonthToDate,
  dateToMonth: propDateToMonth
}) => {
  // Local implementations that can be overridden by props
  const monthToDate = (month: number) => {
    if (propMonthToDate) return propMonthToDate(month);
    const date = new Date();
    date.setMonth(month % 12);
    date.setFullYear(Math.floor(month / 12));
    return date;
  };

  const dateToMonth = (date: Date) => {
    if (propDateToMonth) return propDateToMonth(date);
    return date.getFullYear() * 12 + date.getMonth();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newReturn, setNewReturn] = React.useState<Partial<IncomeItem>>({
    month: dateToMonth(new Date()),
    amount: 0,
    date: new Date(),
    type: 'rental' as const
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
  };

  const handleSaveNew = () => {
    if (newReturn.amount !== undefined && newReturn.date) {
      const date = new Date(newReturn.date);
      const month = dateToMonth(date);
      onStartEdit(returns.length, {
        month,
        amount: newReturn.amount,
        date: date.toISOString(),
        type: 'rental' as const
      });
      onSaveEdit();
      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setNewReturn({
        month: dateToMonth(nextMonth),
        amount: 0,
        date: nextMonth,
        type: 'rental' as const
      });
      setIsAddingNew(false);
    }
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewReturn({
      month: dateToMonth(new Date()),
      amount: 0,
      date: new Date(),
      type: 'rental' as const
    });
  };

  const sortedReturns = [...returns].sort((a, b) => a.month - b.month);
  const totalReturns = returns.reduce((sum, r) => sum + r.amount, 0);

  if (returns.length === 0 && !isAddingNew) return null;

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
              <TableHead className="text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-1"
                onClick={handleAddNew}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Entry
                </span>
              </Button>
            </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReturns.map((returnItem, index) => (
              <TableRow key={index}>
                <TableCell className="p-1">
                  {editingReturn === index ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal text-sm h-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {format(monthToDate(editValues.month), "MMM yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-auto p-0" 
                        align="start"
                        onInteractOutside={(e) => e.preventDefault()}
                      >
                        <Calendar
                          mode="single"
                          selected={editValues.date ? new Date(editValues.date) : monthToDate(editValues.month)}
                          onSelect={(date) => {
                            if (date) {
                              setEditValues(prev => ({
                                ...prev,
                                date,
                                month: dateToMonth(date)
                              }));
                              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                            }
                          }}
                          className="rounded-md border"
                          initialFocus
                        />
                        <div className="flex justify-end p-2 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}
                          >
                            Close
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {returnItem.date 
                          ? format(new Date(returnItem.date), "MMM d, yyyy") 
                          : format(monthToDate(returnItem.month), "MMM d, yyyy")}
                      </span>
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
            {isAddingNew && (
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
                            setNewReturn(prev => ({
                              ...prev,
                              date,
                              month: dateToMonth(date)
                            }));
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
                    onChange={(e) => setNewReturn(prev => ({ ...prev, amount: Number(e.target.value) }))}
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
                      onClick={handleSaveNew}
                      disabled={!newReturn.amount || newReturn.month === undefined}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={handleCancelNew}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
