import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError("Browser doesn't support Speech Recognition.");
        setBrowserSupportsSpeechRecognition(false);
        return;
      }

      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US'; // Or your desired language

      newRecognition.onresult = (event) => {
        let finalTranscript = '';
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(currentInterim);
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' '); // Add space after final segment
        }
      };

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      newRecognition.onend = () => {
        // Only set isListening to false if it wasn't manually stopped by stopListening
        // This allows continuous listening to restart itself unless explicitly stopped.
        // However, for this app, we might want explicit stop.
        // If continuous is true, it might auto-restart on some browsers.
        // For now, let's keep it simple: onend means it stopped.
        setIsListening(false);
      };
      setRecognition(newRecognition);
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setTranscript(''); // Clear previous full transcript
        setInterimTranscript('');
        setError(null);
        recognition.start();
        setIsListening(true);
      } catch (e: any) {
        console.error("Error starting recognition: ", e);
        setError(`Could not start listening: ${e.message}`);
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  };
};

export default useSpeechRecognition;