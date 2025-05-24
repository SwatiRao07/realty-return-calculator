
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, TrendingUp, TrendingDown } from 'lucide-react';

interface CsvImportProps {
  csvData: string;
  setCsvData: (data: string) => void;
  returnsCsvData: string;
  setReturnsCsvData: (data: string) => void;
  onImportPayments: () => void;
  onImportReturns: () => void;
}

export const CsvImport: React.FC<CsvImportProps> = ({
  csvData,
  setCsvData,
  returnsCsvData,
  setReturnsCsvData,
  onImportPayments,
  onImportReturns
}) => {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Import Payments (CSV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label htmlFor="csvData">Paste CSV Data</Label>
            <Textarea
              id="csvData"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="May-2025,₹1,460,461,On Booking
Jun-2025,₹2,920,922,On Agreement"
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Date (May-2025), Amount (₹1,460,461), Description
            </p>
          </div>
          <Button 
            onClick={onImportPayments} 
            disabled={!csvData.trim()}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Payments
          </Button>
        </CardContent>
      </Card>

      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Import Returns (CSV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label htmlFor="returnsCsvData">Paste CSV Data</Label>
            <Textarea
              id="returnsCsvData"
              value={returnsCsvData}
              onChange={(e) => setReturnsCsvData(e.target.value)}
              placeholder="Jun-2026,₹25,000,Monthly Rent
Mar-2028,₹80,00,000,Property Sale"
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Date (Jun-2026), Amount (₹25,000), Description
            </p>
          </div>
          <Button 
            onClick={onImportReturns} 
            disabled={!returnsCsvData.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Returns
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
