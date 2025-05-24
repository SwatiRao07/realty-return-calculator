
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentsCashFlow from '@/components/PaymentsCashFlow';
import { FinancialMetrics } from '@/components/FinancialMetrics';
import { ProjectData, Payment } from '@/types/project';
import { TrendingUp, BarChart3 } from 'lucide-react';

const Index = () => {
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: 'New Project',
    annualInterestRate: 12, // 12% annual interest rate
    payments: [],
    rentalIncome: [],
    operatingExpenses: []
  });

  const updateProjectData = (updates: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...updates }));
  };

  const updatePayments = (payments: Payment[]) => {
    setProjectData(prev => ({ ...prev, payments }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <TrendingUp className="text-blue-600" />
            Real Estate Investment Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive cash flow analysis for Indian real estate projects
          </p>
        </div>

        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cashflow" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Cash Flow</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis & Setup</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-0">
                <PaymentsCashFlow 
                  projectData={projectData}
                  updateProjectData={updateProjectData}
                  updatePayments={updatePayments}
                  showOnlyCashFlow={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="flex items-center text-base font-medium text-gray-700 gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Cash Flow Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <PaymentsCashFlow 
                    projectData={projectData}
                    updateProjectData={updateProjectData}
                    updatePayments={updatePayments}
                    showOnlyAnalysis={true}
                  />
                </CardContent>
              </Card>
              
              <FinancialMetrics 
                projectData={projectData} 
                updateProjectData={updateProjectData}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
