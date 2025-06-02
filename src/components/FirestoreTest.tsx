import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testFirestoreConnection } from '@/lib/firestoreTest';
import { Database, AlertCircle } from 'lucide-react';

export const FirestoreTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const testResult = await testFirestoreConnection();
      
      if (testResult.includes('failed')) {
        setError(testResult);
      } else {
        setResult(testResult);
      }
    } catch (err) {
      setError('Test execution failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Firestore Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Use this tool to test your Firestore connection and diagnose any issues.
          </p>
          
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Run Firestore Test'}
          </Button>
          
          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              {result}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error:</p>
                <p>{error}</p>
                <p className="mt-2 text-sm">
                  Check the browser console (F12 &gt; Console) for more detailed error information.
                </p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Common issues:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Firestore security rules are too restrictive</li>
              <li>Firebase configuration is incorrect</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirestoreTest;
