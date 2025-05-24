
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectSetup } from '@/components/ProjectSetup';
import { PaymentSchedule } from '@/components/PaymentSchedule';
import { CashFlowAnalysis } from '@/components/CashFlowAnalysis';
import { FinancialMetrics } from '@/components/FinancialMetrics';
import { ProjectData, Payment } from '@/types/project';
import { Calculator, TrendingUp, FileSpreadsheet, BarChart3 } from 'lucide-react';

const Index = () => {
  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: 'New Project',
    purchasePrice: 5000000,
    closingCosts: 100000,
    renovationCosts: 1000000,
    salePrice: 8000000,
    saleMonth: 24,
    sellingCosts: 200000,
    monthlyInterestRate: 0.01,
    discountRate: 0.12,
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
            <Calculator className="text-blue-600" />
            Real Estate Investment Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive cash flow analysis for Indian real estate projects
          </p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:flex">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Cash Flow</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Metrics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Project Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectSetup 
                  projectData={projectData} 
                  updateProjectData={updateProjectData} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  Payment Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentSchedule 
                  payments={projectData.payments}
                  updatePayments={updatePayments}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Cash Flow Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CashFlowAnalysis projectData={projectData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <FinancialMetrics projectData={projectData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
