import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  startHistorySession, 
  endHistorySession, 
  recordOperation 
} from '@/lib/historyService';
import { HistorySession, HistoryOperation, OperationType, OperationMetadata } from '@/types/history';
import { ProjectData } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

interface HistoryContextType {
  activeSession: HistorySession | null;
  recordOperation: (
    type: OperationType, 
    metadata: OperationMetadata, 
    projectSnapshot?: Partial<ProjectData>
  ) => Promise<HistoryOperation | null>;
  startNewSession: (projectId?: string, projectName?: string) => Promise<void>;
  endCurrentSession: () => Promise<void>;
  isRecording: boolean;
  toggleRecording: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<HistorySession | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const { toast } = useToast();

  // Start a new session when the app loads
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log('Initializing history session');
        const session = await startHistorySession();
        console.log('History session initialized:', session);
        setActiveSession(session);
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start history session:', error);
        // Set recording to false but don't show error toast yet
        // This prevents the user from seeing errors on initial load
        setIsRecording(false);
      }
    };

    // Start with a slight delay to ensure Firebase is fully initialized
    const timer = setTimeout(() => {
      initSession().catch(err => {
        console.error('Failed to initialize session after delay:', err);
        setIsRecording(false);
      });
    }, 1000);

    // End the session when the component unmounts
    return () => {
      clearTimeout(timer);
      if (activeSession) {
        endHistorySession(activeSession.id).catch(console.error);
      }
    };
  }, []);

  const recordOperationWithContext = async (
    type: OperationType,
    metadata: OperationMetadata,
    projectSnapshot?: Partial<ProjectData>
  ): Promise<HistoryOperation | null> => {
    // If recording is off or no active session, don't attempt to record
    if (!isRecording) return null;
    
    // If no active session but recording is on, try to create a new session first
    if (!activeSession && isRecording) {
      try {
        console.log('No active session but recording is on - creating new session');
        const newSession = await startHistorySession(
          projectSnapshot?.id,
          projectSnapshot?.projectName
        );
        setActiveSession(newSession);
        
        // Now we have a session, proceed with recording
        try {
          const operation = await recordOperation(
            newSession.id,
            type,
            metadata,
            projectSnapshot
          );
          return operation;
        } catch (innerError) {
          console.error('Failed to record operation after creating session:', innerError);
          return null;
        }
      } catch (sessionError) {
        console.error('Failed to create session for recording:', sessionError);
        // Turn off recording since we're having issues
        setIsRecording(false);
        return null;
      }
    }
    
    // Normal case - we have an active session and recording is on
    if (activeSession && isRecording) {
      try {
        const operation = await recordOperation(
          activeSession.id,
          type,
          metadata,
          projectSnapshot
        );
        return operation;
      } catch (error) {
        console.error('Failed to record operation:', error);
        return null;
      }
    }
    
    return null;
  };

  const startNewSession = async (projectId?: string, projectName?: string) => {
    // End the current session if it exists
    if (activeSession) {
      await endCurrentSession();
    }

    try {
      const session = await startHistorySession(projectId, projectName);
      setActiveSession(session);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start new history session:', error);
      toast({
        title: 'History Error',
        description: 'Failed to start new history session.',
        variant: 'destructive',
      });
    }
  };

  const endCurrentSession = async () => {
    if (!activeSession) return;

    try {
      await endHistorySession(activeSession.id);
      setActiveSession(null);
    } catch (error) {
      console.error('Failed to end history session:', error);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording && !activeSession) {
      // Start a new session if we're turning recording on and don't have an active session
      await startNewSession();
    }
    setIsRecording(!isRecording);
  };

  return (
    <HistoryContext.Provider
      value={{
        activeSession,
        recordOperation: recordOperationWithContext,
        startNewSession,
        endCurrentSession,
        isRecording,
        toggleRecording,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};

export default useHistory;
