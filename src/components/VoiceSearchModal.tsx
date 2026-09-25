import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Search, AlertCircle, Sparkles } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptReady: (transcript: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscriptReady,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setErrorMessage(null);
      return;
    }

    startListening();

    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech Recognition is not natively supported in this browser. Please use the search bar or camera.'
      );
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setTranscript(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser bar.'
          );
        } else if (event.error === 'no-speech') {
          // keep waiting
        } else {
          setErrorMessage(
            'Voice input was interrupted. Please speak clearly into your microphone.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice recognition initialization error:', err);
      setIsListening(false);
      setErrorMessage(
        'Voice input could not start. Please use the text search bar.'
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSubmit = () => {
    stopListening();
    if (transcript.trim()) {
      onTranscriptReady(transcript.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-6 sm:p-8 flex flex-col items-center text-center text-white space-y-6">
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Voice Material Search
          </div>
          <h3 className="text-xl font-black text-white">
            {isListening ? 'Listening to your voice...' : 'Voice Search'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Say a material name or natural request, e.g. <span className="text-emerald-300">&ldquo;50 kg coconut husk near Chennai&rdquo;</span>
          </p>
        </div>

        {/* Visual Pulse / Equalizer Animation */}
        <div className="relative flex items-center justify-center my-4">
          {isListening && (
            <>
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/10 animate-pulse" />
            </>
          )}

          <button
            onClick={() => {
              if (isListening) stopListening();
              else startListening();
            }}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isListening ? 'Click to pause' : 'Click to start speaking'}
          >
            {isListening ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
          </button>
        </div>

        {/* Live Transcript Display */}
        <div className="w-full min-h-[70px] p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
          {transcript ? (
            <p className="text-sm sm:text-base font-extrabold text-white text-center leading-relaxed">
              &ldquo;{transcript}&rdquo;
            </p>
          ) : isListening ? (
            <p className="text-xs text-slate-400 italic animate-pulse">
              Speak now... your voice transcript will appear here in real-time.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Click the microphone button to start speaking.
            </p>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="w-full p-3 rounded-xl bg-amber-950/80 border border-amber-700 text-amber-200 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!transcript.trim()}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Search This Query</span>
          </button>
        </div>

      </div>
    </div>
  );
};
