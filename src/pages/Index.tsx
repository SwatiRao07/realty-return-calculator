import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PaymentsCashFlow from '@/components/PaymentsCashFlow';
import { FinancialMetrics } from '@/components/FinancialMetrics';
import { AnalysisSetup } from '@/components/AnalysisSetup';
import { ProjectManager } from '@/components/ProjectManager';
import FirestoreTest from '@/components/FirestoreTest';
import HistoryViewer from '@/components/HistoryViewer';
import FileImporter from '@/components/FileImporter';
import { ProjectData, Payment } from '@/types/project';
import { useHistory } from '@/hooks/useHistoryContext';
import { TrendingUp, BarChart3, Save, FileUp, Upload } from 'lucide-react';
import { OperationType, OperationMetadata } from '@/types/history';

const Index = () => {
  const { isRecording, recordOperation } = useHistory();
  
  // Add state to control the import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [projectData, setProjectData] = useState<ProjectData>({
    projectName: 'New Project',
    annualInterestRate: 12, // 12% annual interest rate
    purchasePrice: 0,
    closingCosts: 0,
    renovationCosts: 0,
    salePrice: 0,
    saleMonth: 12,
    sellingCosts: 0,
    monthlyInterestRate: 1, // 1% monthly interest rate
    discountRate: 10, // 10% discount rate
    payments: [],
    rentalIncome: [],
    operatingExpenses: []
  });

  // Enhanced updateProjectData with history recording
  const updateProjectData = (updates: Partial<ProjectData>) => {
    setProjectData(prev => {
      const newData = { ...prev, ...updates };
      
      // Record in history if it's a significant change
      if (updates.projectName || 
          updates.annualInterestRate !== undefined ||
          updates.purchasePrice !== undefined ||
          updates.salePrice !== undefined ||
          updates.saleMonth !== undefined) {
        
        // Prepare settings changes for history metadata
        const settingsChanged = Object.entries(updates)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => ({
            fieldName: key,
            oldValue: prev[key as keyof ProjectData],
            newValue: value
          }));
        
        recordHistoryOp(
          'project_settings_changed',
          {
            timestamp: new Date(),
            projectId: newData.id,
            projectName: newData.projectName,
            settingsChanged
          },
          newData
        );
      }
      
      return newData;
    });
  };

  // Enhanced updatePayments with history recording
  const updatePayments = (payments: Payment[]) => {
    setProjectData(prev => {
      const newData = { ...prev, payments };
      
      // Only record major payment changes
      // We don't want to record every small edit
      if (Math.abs(payments.length - prev.payments.length) > 0) {
        recordHistoryOp(
          payments.length > prev.payments.length ? 'payment_added' : 'payment_deleted',
          {
            timestamp: new Date(),
            projectId: newData.id,
            projectName: newData.projectName,
            details: {
              previousCount: prev.payments.length,
              newCount: payments.length
            }
          },
          newData
        );
      }
      
      return newData;
    });
  };
  
  // Record keeping for history
  const recordHistoryOp = (type: OperationType, metadata: Partial<OperationMetadata>, snapshot?: Partial<ProjectData>) => {
    if (isRecording) {
      // Ensure metadata has a timestamp which is required by OperationMetadata
      const fullMetadata = {
        timestamp: new Date(),
        ...metadata
      };
      recordOperation(type, fullMetadata as OperationMetadata, snapshot);
    }
  };
  
  // Handle data imported from files
  const handleImportedData = (importedPayments: Payment[]) => {
    // Add the imported payments to the current project
    setProjectData((prev) => {
      const existingPayments = [...prev.payments];
      const newPayments = [...importedPayments];
      
      // Combine existing and new payments
      const combinedPayments = [...existingPayments, ...newPayments];
      
      // Create updated project data
      const newData = {
        ...prev,
        payments: combinedPayments
      };
      
      // Record this operation
      recordHistoryOp(
        'csv_imported',
        {
          timestamp: new Date(),
          projectId: newData.id,
          projectName: newData.projectName,
          csvData: {
            rawContent: JSON.stringify(importedPayments),
            parsedData: importedPayments,
            importedAt: new Date()
          },
          details: {
            count: importedPayments.length
          }
        },
        newData
      );

      // Close the import dialog after successful import
      setTimeout(() => {
        setImportDialogOpen(false);
      }, 500);
      
      return newData;
    });
  };
  
  // Handle restoring state from history - extremely simplified version
  const handleRestoreFromHistory = (restoredData: ProjectData) => {
    try {
      console.log('Received data to restore:', restoredData);
      
      // Create basic default project
      const defaultProject: ProjectData = {
        projectName: 'New Project',
        annualInterestRate: 12,
        purchasePrice: 0,
        closingCosts: 0,
        renovationCosts: 0,
        salePrice: 0,
        saleMonth: 12,
        sellingCosts: 0,
        monthlyInterestRate: 1,
        discountRate: 10,
        payments: [],
        rentalIncome: [],
        operatingExpenses: []
      };
      
      // Merge with provided data, with defaults taking priority
      const newProjectData = {
        ...defaultProject,
        ...restoredData,
        // Ensure arrays are present
        payments: Array.isArray(restoredData.payments) ? restoredData.payments : [],
        rentalIncome: Array.isArray(restoredData.rentalIncome) ? restoredData.rentalIncome : [],
        operatingExpenses: Array.isArray(restoredData.operatingExpenses) ? restoredData.operatingExpenses : []
      };
      
      console.log('Setting project data to:', newProjectData);
      
      // Set the project data directly
      setProjectData(newProjectData);
      
      // Record this restoration
      recordOperation(
        'project_loaded',
        {
          timestamp: new Date(),
          projectId: newProjectData.id,
          projectName: newProjectData.projectName,
          details: { source: 'history_restore' }
        },
        newProjectData
      );
    } catch (error) {
      console.error('Error in handleRestoreFromHistory:', error);
      // Set to default project if restoration fails
      setProjectData({
        projectName: 'Recovery Project',
        annualInterestRate: 12,
        purchasePrice: 0,
        closingCosts: 0,
        renovationCosts: 0,
        salePrice: 0,
        saleMonth: 12,
        sellingCosts: 0,
        monthlyInterestRate: 1,
        discountRate: 10,
        payments: [],
        rentalIncome: [],
        operatingExpenses: []
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <TrendingUp className="text-blue-600" />
              Real Estate Investment Analyzer
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive cash flow analysis for Indian real estate projects
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{projectData.projectName}</div>
              {projectData.id && <div className="text-xs text-gray-500">Project ID: {projectData.id}</div>}
            </div>
            <div className="flex items-center gap-2">
              <ProjectManager 
                projectData={projectData} 
                updateProjectData={(data) => setProjectData(data)} 
              />
              <HistoryViewer 
                onRestoreState={handleRestoreFromHistory} 
              />
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import File
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                    <DialogDescription>
                      Import data from Excel, CSV, PDF, or Word documents
                    </DialogDescription>
                  </DialogHeader>
                  <FileImporter onDataImported={handleImportedData} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
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
                <CardHeader>
                  <CardTitle className="text-xl">Project Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentsCashFlow 
                    projectData={projectData}
                    updateProjectData={updateProjectData}
                    updatePayments={updatePayments}
                    showOnlyCashFlow={false}
                  />
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl">Project Analysis & Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalysisSetup projectData={projectData} updateProjectData={updateProjectData} />
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl">Financial Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialMetrics projectData={projectData} updateProjectData={updateProjectData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
