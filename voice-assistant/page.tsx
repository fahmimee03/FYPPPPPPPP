"use client";

import { useState, useEffect, useCallback } from 'react';
import useSpeechRecognition from '../../../hooks/useSpeechRecognition'; // Assuming hooks is at root
import Checklist, { ChecklistItemType } from '../../../components/CheckList';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Mic, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_CHECKLIST_ITEMS: ChecklistItemType[] = [
  { id: 'machine_id', label: 'Machine ID', keywords: ['machine id', 'machine number', 'id'], detected: false, validationRegex: /^\d+$/, errorMessage: 'Must be a number' },
  { id: 'machine_department', label: 'Machine Department', keywords: ['department', 'machine department', 'dept'], detected: false },
  { id: 'chief_complaint', label: 'Chief Complaint / Problem', keywords: ['problem', 'complaint', 'issue', 'reason for call'], detected: false },
  { id: 'person_reporting', label: 'Person Reporting', keywords: ['my name is', 'reporting person', 'caller name'], detected: false },
  { id: 'phone_number', label: 'Phone Number', keywords: ['phone number', 'contact number', 'call me back at'], detected: false, validationRegex: /^\+?[0-9\s-()]{7,20}$/, errorMessage: 'Invalid phone format' },
];

export default function VoiceAssistantPage() {
  const {
    transcript,
    interimTranscript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript: resetSpeech,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>(INITIAL_CHECKLIST_ITEMS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemDateTime, setSystemDateTime] = useState('');

  useEffect(() => {
    setSystemDateTime(new Date().toLocaleString());
    const timer = setInterval(() => setSystemDateTime(new Date().toLocaleString()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const processTranscriptForKeywords = useCallback((fullTranscript: string) => {
    setChecklistItems(prevItems =>
      prevItems.map(item => {
        const found = item.keywords.some((keyword: string) =>
          fullTranscript.toLowerCase().includes(keyword.toLowerCase())
        );
        return { ...item, detected: item.detected || found };
      })
    );
  }, []);

  useEffect(() => {
    if (transcript) {
      processTranscriptForKeywords(transcript);
    }
  }, [transcript, processTranscriptForKeywords]);

  useEffect(() => {
    if (interimTranscript) {
       processTranscriptForKeywords(interimTranscript);
    }
  }, [interimTranscript, processTranscriptForKeywords]);

  const allItemsDetected = checklistItems.every(item => item.detected);

  const handleReset = () => {
    resetSpeech();
    setChecklistItems(INITIAL_CHECKLIST_ITEMS.map(item => ({ ...item, detected: false, value: null, errorMessage: undefined })));
    if (isListening) stopListening();
    toast.info("Form reset.");
  };

  const handleSend = async () => {
    if (!allItemsDetected || !transcript.trim()) {
      toast.error("Please ensure all checklist items are addressed and there is a transcript.");
      return;
    }
    setIsProcessing(true);
    toast.loading("Processing and saving data...");

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawTranscript: transcript.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Log submitted successfully!");
        if (result.extractedData) {
            setChecklistItems(prev => prev.map(item => {
                const key = item.id as keyof typeof result.extractedData;
                const newValue = result.extractedData[key];
                return {
                    ...item,
                    value: newValue !== undefined ? String(newValue) : item.value,
                    detected: (newValue !== undefined && newValue !== null) || item.detected
                };
            }));
        }
      } else {
        toast.error(`Error: ${result.error || 'Failed to submit log'}`);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <Card className="max-w-2xl mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertCircle className="mr-2" /> Speech Recognition Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your browser does not support the Web Speech API. Please try a different browser like Chrome or Edge.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Voice Assistant</CardTitle>
          <CardDescription>Click the microphone and speak. We'll try to capture the required information.</CardDescription>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current Date & Time: {systemDateTime}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`px-6 py-6 rounded-full text-lg ${
                isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Mic className="h-8 w-8 mr-2" />
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Button>
          </div>

          {speechError && <p className="text-sm text-red-500 text-center"><AlertCircle className="inline mr-1 h-4 w-4" />{speechError}</p>}

          <div className="p-4 border rounded-md min-h-[100px] bg-slate-50 dark:bg-slate-800">
            <p className="text-slate-700 dark:text-slate-200">{transcript} <span className="text-slate-400 dark:text-slate-500">{interimTranscript}</span></p>
            {!transcript && !interimTranscript && !isListening && (
              <p className="text-slate-400 dark:text-slate-500 italic">Transcript will appear here...</p>
            )}
          </div>

          <Checklist items={checklistItems} />
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <Button
            onClick={handleSend}
            disabled={!allItemsDetected || isProcessing || !transcript.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Send to Database'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}