import { ProjectData } from './project';

export type OperationType = 
  | 'project_created'
  | 'project_loaded'
  | 'project_saved'
  | 'interest_calculated'
  | 'payment_added'
  | 'payment_deleted'
  | 'payment_edited'
  | 'csv_imported'
  | 'rental_added'
  | 'project_settings_changed';

export interface ImportedCsvData {
  rawContent: string;
  parsedData: Array<Record<string, any>>;
  importedAt: Date | any;
}

export interface OperationMetadata {
  // Common fields
  timestamp: Date | any;
  
  // CSV specific data
  csvData?: ImportedCsvData;
  
  // Payment specific data
  paymentData?: {
    amount: number;
    month: number;
    description?: string;
  };
  
  // Project specific data
  projectId?: string;
  projectName?: string;
  
  // Settings changes
  settingsChanged?: {
    fieldName: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Interest calculation
  interestData?: {
    rate: number;
    totalInterest: number;
    numberOfPayments: number;
  };
  
  // Additional details as JSON
  details?: Record<string, any>;
}

export interface HistoryOperation {
  id: string;
  type: OperationType;
  metadata: OperationMetadata;
  
  // Snapshot of the project at this point
  projectSnapshot?: Partial<ProjectData>;
}

export interface HistorySession {
  id: string;
  startTime: Date | any;
  endTime?: Date | any;
  operations: HistoryOperation[];
  projectId?: string;
  projectName?: string;
  isActive: boolean;
}
