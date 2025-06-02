import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/hooks/useHistoryContext';
import { ProjectData } from '@/types/project';
import { History, AlertTriangle } from 'lucide-react';

interface HistoryViewerProps {
  onRestoreState?: (projectData: ProjectData) => void;
}

const SimpleHistoryViewer: React.FC<HistoryViewerProps> = ({ onRestoreState }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isRecording, toggleRecording } = useHistory();
  const { toast } = useToast();
  
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Operation History
            </DialogTitle>
            <DialogDescription>
              Track and restore previous operations and project states
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Coming Soon</AlertTitle>
              <AlertDescription>
                We're working on this feature to allow you to view and restore previous operations. 
                It will be available in the next update.
              </AlertDescription>
            </Alert>
            
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
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimpleHistoryViewer;
