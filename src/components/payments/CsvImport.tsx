
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowUpDown } from 'lucide-react';

interface CsvImportProps {
  csvData: string;
  setCsvData: (data: string) => void;
  onImportCashFlow: () => void;
}

export const CsvImport: React.FC<CsvImportProps> = ({
  csvData,
  setCsvData,
  onImportCashFlow
}) => {
  return (
    <Card className="border-blue-200 shadow-sm">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <ArrowUpDown className="w-4 h-4 text-blue-600" />
          Import Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-2">
        <div>
          <Textarea
            id="csvData"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="May-2025,-₹1,460,461,On Booking (payment)
Jun-2026,₹25,000,Monthly Rent (return)"
            rows={3}
            className="font-mono text-xs mb-1 focus:border-blue-300"
          />
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <span className="text-blue-500 mr-1">ⓘ</span> 
            <span>Negative amounts = payments, positive = returns</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              onImportCashFlow();
            }} 
            disabled={!csvData.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 h-8"
            type="button"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
