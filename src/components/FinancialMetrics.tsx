
import React from 'react';
import { ProjectData } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';

interface FinancialMetricsProps {
  projectData: ProjectData;
  updateProjectData: (updates: Partial<ProjectData>) => void;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ projectData, updateProjectData }) => {
  const handleInputChange = (field: keyof ProjectData, value: number) => {
    updateProjectData({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Interest Rate Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="annualInterestRate">Annual Interest Rate (APR) (%)</Label>
              <Input
                id="annualInterestRate"
                type="number"
                step="0.1"
                value={projectData.annualInterestRate}
                onChange={(e) => handleInputChange('annualInterestRate', Number(e.target.value))}
                placeholder="12.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(projectData.annualInterestRate / 12).toFixed(2)}% monthly rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
