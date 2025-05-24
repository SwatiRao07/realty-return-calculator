import { format } from 'date-fns';

export interface CashFlowEntry {
  id: string;
  date?: string | Date;
  month: number;
  amount: number;
  description?: string;
  type?: 'payment' | 'return' | 'interest';
  debtFunded?: boolean;
}

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If the field contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCsv = (entries: CashFlowEntry[]): string => {
  const headers = ['Date', 'Type', 'Amount', 'Currency', 'Description'];
  const rows = [];
  
  // Add header row
  rows.push(headers.join(','));
  
  // Add data rows
  for (const entry of entries) {
    try {
      const date = entry.date ? new Date(entry.date) : monthToDate(entry.month);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let typeString = 'Payment'; // Default
      if (entry.type === 'return') {
        typeString = 'Return';
      } else if (entry.type === 'interest') {
        typeString = 'Interest';
      } else if (entry.type === 'payment') {
        typeString = 'Payment';
      }
      
      // Clean up the description - remove any existing quotes and extra spaces
      let description = (entry.description || '').trim();
      // Remove surrounding quotes and extra spaces if they exist
      description = description.replace(/^["']+|["']+$/g, '').trim();
      // Remove any remaining quotes around values
      description = description.replace(/"([^"]+)"/g, '$1');
      
      // Format amount - negative for payments and interest, positive for returns
      const amountValue = (entry.type === 'payment' || entry.type === 'interest') ? -Math.abs(entry.amount) : Math.abs(entry.amount);
      const amount = amountValue.toFixed(2);
      const currency = 'INR';
      
      const row = [
        escapeCsvField(formattedDate),
        escapeCsvField(typeString),
        escapeCsvField(amount),
        escapeCsvField(currency),
        escapeCsvField(description)
      ];
      
      rows.push(row.join(','));
    } catch (e) {
      console.error('Error processing entry:', entry, e);
    }
  }
  
  return rows.join('\n');
};

// Helper function to convert month number to Date
function monthToDate(month: number): Date {
  const date = new Date();
  date.setMonth(month - 1);
  return date;
}

export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};
