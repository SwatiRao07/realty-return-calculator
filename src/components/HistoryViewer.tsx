import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/hooks/useHistoryContext';
import { ProjectData } from '@/types/project';
import { HistoryOperation, HistorySession, OperationType } from '@/types/history';
import { getHistorySessions, getSessionOperations, getRecentOperations } from '@/lib/historyService';
import { format } from 'date-fns';
import { History, Clock, RefreshCw, ArrowRight, FileText, BarChart3, TableProperties } from 'lucide-react';

interface HistoryViewerProps {
  onRestoreState?: (projectData: ProjectData) => void;
}

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'csv_imported':
      return <TableProperties className="w-4 h-4" />;
    case 'interest_calculated':
      return <BarChart3 className="w-4 h-4" />;
    case 'project_saved':
      return <FileText className="w-4 h-4" />;
    case 'project_created':
    case 'project_loaded':
      return <FileText className="w-4 h-4" />;
    case 'payment_added':
    case 'payment_deleted':
    case 'payment_edited':
      return <BarChart3 className="w-4 h-4" />;
    default:
      return <History className="w-4 h-4" />;
  }
};

const getOperationTitle = (type: string) => {
  switch (type) {
    case 'csv_imported':
      return 'CSV Imported';
    case 'interest_calculated':
      return 'Interest Calculated';
    case 'project_saved':
      return 'Project Saved';
    case 'project_created':
      return 'Project Created';
    case 'project_loaded':
      return 'Project Loaded';
    case 'payment_added':
      return 'Payment Added';
    case 'payment_deleted':
      return 'Payment Deleted';
    case 'payment_edited':
      return 'Payment Edited';
    case 'rental_added':
      return 'Rental Added';
    case 'project_settings_changed':
      return 'Settings Changed';
    default:
      return 'Operation';
  }
};

// Remove timestamp formatting to avoid invalid date issues

const OperationItem: React.FC<{
  operation: HistoryOperation;
  onRestore?: (operation: HistoryOperation) => void;
}> = ({ operation, onRestore }) => {
  // Debug the operation's snapshot
  const hasSnapshot = !!operation.projectSnapshot;
  return (
    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {getOperationIcon(operation.type)}
          <span className="font-medium">{getOperationTitle(operation.type)}</span>
        </div>
      </div>
      
      {(operation.metadata?.csvData || operation.metadata?.paymentData || operation.metadata?.settingsChanged) && (
        <div className="text-sm text-gray-600 mb-2">
          {operation.metadata.csvData && (
            <div>Imported {operation.metadata.csvData.parsedData?.length || 0} records</div>
          )}
          {operation.metadata.paymentData && (
            <div>Amount: {operation.metadata.paymentData.amount}, Month: {operation.metadata.paymentData.month}</div>
          )}
          {operation.metadata.settingsChanged && (
            <div>Settings changed: {operation.metadata.settingsChanged.length} fields</div>
          )}
        </div>
      )}
      
      {onRestore && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs mt-1"
          onClick={() => onRestore(operation)}
          disabled={!hasSnapshot}
        >
          <RefreshCw className="w-3 h-3 mr-1" /> 
          {hasSnapshot ? 'Restore this state' : 'No state to restore'}
        </Button>
      )}
    </div>
  );
};

const SessionItem: React.FC<{
  session: HistorySession;
  onViewSession: (sessionId: string) => void;
}> = ({ session, onViewSession }) => {
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          {session.projectName || 'Unnamed Session'}
        </CardTitle>
      </CardHeader>
      <CardFooter className="pt-2">
        <Button variant="ghost" size="sm" onClick={() => onViewSession(session.id)}>
          View Session <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const HistoryViewer: React.FC<HistoryViewerProps> = ({ onRestoreState }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [recentOperations, setRecentOperations] = useState<HistoryOperation[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionOperations, setSessionOperations] = useState<HistoryOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isRecording, toggleRecording } = useHistory();
  const { toast } = useToast();
  
  const loadHistoryData = async () => {
    if (!isDialogOpen) return;
    
    setIsLoading(true);
    try {
      // Fetch sessions and recent operations
      const [fetchedSessions, fetchedOperations] = await Promise.all([
        getHistorySessions(),
        getRecentOperations(20)
      ]);
      
      console.log('Loaded history sessions:', fetchedSessions);
      console.log('Loaded recent operations:', fetchedOperations);
      
      setSessions(fetchedSessions);
      setRecentOperations(fetchedOperations);
    } catch (error) {
      console.error('Error loading history data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load history data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const viewSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('session');
    
    setIsLoading(true);
    try {
      const operations = await getSessionOperations(sessionId);
      console.log('Loaded session operations:', operations);
      setSessionOperations(operations);
    } catch (error) {
      console.error('Error loading session operations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session operations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a default empty project for restoration when snapshot is missing
  const createDefaultProject = (): ProjectData => {
    return {
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
  };

  const handleRestoreOperation = (operation: HistoryOperation) => {
    try {
      if (!onRestoreState) {
        toast({
          title: 'Restore Failed',
          description: 'Restore function not available',
          variant: 'destructive'
        });
        return;
      }
      
      // If no snapshot, use default project
      const projectToRestore = operation.projectSnapshot || createDefaultProject();
      
      // Apply the restoration directly without additional processing
      onRestoreState(projectToRestore as ProjectData);
      
      toast({
        title: 'State Restored',
        description: 'Project has been restored successfully',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error restoring state:', error);
      toast({
        title: 'Restore Failed',
        description: 'An error occurred while restoring the project state',
        variant: 'destructive'
      });
    }
  };
  
  // Load data when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadHistoryData();
    }
  }, [isDialogOpen]);
  
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Operation History
            </DialogTitle>
            <DialogDescription>
              Track and restore previous operations and project states
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                size="sm"
                className={isRecording ? "bg-red-50" : "bg-green-50"}
                onClick={() => {
                  toggleRecording();
                  toast({
                    title: isRecording ? "Recording Paused" : "Recording Started",
                    description: isRecording 
                      ? "History recording has been paused." 
                      : "Your operations will now be recorded."
                  });
                }}
              >
                {isRecording ? "Pause Recording" : "Start Recording"}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadHistoryData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">Recent Operations</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recent" className="mt-4">
                {recentOperations.length === 0 ? (
                  <Alert>
                    <AlertTitle>No recent operations</AlertTitle>
                    <AlertDescription>
                      Your recent operations will appear here once you perform some actions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[400px]">
                    {recentOperations.map(operation => (
                      <OperationItem 
                        key={operation.id} 
                        operation={operation} 
                        onRestore={handleRestoreOperation}
                      />
                    ))}
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="sessions" className="mt-4">
                {sessions.length === 0 ? (
                  <Alert>
                    <AlertTitle>No sessions found</AlertTitle>
                    <AlertDescription>
                      Your history sessions will appear here once you start recording.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[400px]">
                    {sessions.map(session => (
                      <SessionItem 
                        key={session.id} 
                        session={session} 
                        onViewSession={viewSession}
                      />
                    ))}
                  </ScrollArea>
                )}
              </TabsContent>
              
              {selectedSessionId && (
                <TabsContent value="session" className="mt-4">
                  {sessionOperations.length === 0 ? (
                    <Alert>
                      <AlertTitle>No operations in this session</AlertTitle>
                      <AlertDescription>
                        This session doesn't have any recorded operations.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      {sessionOperations.map(operation => (
                        <OperationItem 
                          key={operation.id} 
                          operation={operation} 
                          onRestore={handleRestoreOperation}
                        />
                      ))}
                    </ScrollArea>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistoryViewer;
