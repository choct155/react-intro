import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseTodo, ParsedTodo } from '../utils/voiceUtils';

interface Props {
  onConfirm: (parsed: ParsedTodo) => void;
  onCancel: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'done' | 'error';

const PRIO_COLORS = { high: '#ff5252', medium: '#ffab40', low: '#69f0ae' };

function isSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export default function VoiceInput({ onConfirm, onCancel }: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [parsed, setParsed] = useState<ParsedTodo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recogRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!isSupported()) {
      setErrorMsg('Speech recognition is not supported in this browser. Try Chrome on Android.');
      setVoiceState('error');
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog: SpeechRecognition = new SR();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onstart = () => setVoiceState('listening');

    recog.onresult = (event: SpeechRecognitionEvent) => {
      let fin = '';
      let intr = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) fin += t;
        else intr += t;
      }
      if (fin) setTranscript((prev) => (prev + ' ' + fin).trim());
      setInterim(intr);
    };

    recog.onend = () => {
      setInterim('');
      setVoiceState('processing');
    };

    recog.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msgs: Record<string, string> = {
        'no-speech': 'No speech detected. Tap the mic and try again.',
        'not-allowed': 'Microphone permission denied. Allow mic access in browser settings.',
        'network': 'Network error during speech recognition.',
      };
      setErrorMsg(msgs[event.error] || `Speech error: ${event.error}`);
      setVoiceState('error');
    };

    recogRef.current = recog;
    recog.start();
  }, []);

  useEffect(() => {
    if (voiceState === 'processing') {
      if (transcript.trim()) {
        setParsed(parseTodo(transcript));
        setVoiceState('done');
      } else {
        setErrorMsg('No speech detected. Tap the mic and try again.');
        setVoiceState('error');
      }
    }
  }, [voiceState, transcript]);

  const handleStop = () => recogRef.current?.stop();

  const handleReset = () => {
    setTranscript('');
    setInterim('');
    setParsed(null);
    setErrorMsg('');
    setVoiceState('idle');
  };

  const stateLabel: Record<VoiceState, string> = {
    idle: 'Tap the mic and speak your todo',
    listening: 'Listening… tap again to stop',
    processing: 'Processing…',
    done: 'Tap "Add Todo" to confirm',
    error: errorMsg,
  };

  const micClick = () => {
    if (voiceState === 'listening') handleStop();
    else if (voiceState === 'idle' || voiceState === 'error') startListening();
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-label="Voice input"
    >
      <div className="voice-panel">
        <div className="panel-header">
          <span className="panel-title">Voice Input</span>
          <button className="close-btn" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <div className="voice-mic-area">
          <button
            className={`voice-mic-btn${voiceState === 'listening' ? ' listening' : ''}`}
            onClick={micClick}
            disabled={voiceState === 'processing'}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start listening'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" aria-hidden="true">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </button>
          <p className="voice-state-label">{stateLabel[voiceState]}</p>
        </div>

        {(transcript || interim) && (
          <div className="voice-transcript">
            <span className="t-final">{transcript}</span>
            {interim && <span className="t-interim"> {interim}</span>}
          </div>
        )}

        {parsed && voiceState === 'done' && (
          <div className="voice-parsed">
            <p className="parsed-text">"{parsed.text}"</p>
            <div className="parsed-badges">
              <span
                className="badge"
                style={{
                  background: PRIO_COLORS[parsed.priority] + '22',
                  color: PRIO_COLORS[parsed.priority],
                }}
              >
                {parsed.priority}
              </span>
              {parsed.category !== 'General' && (
                <span className="badge badge-cat">{parsed.category}</span>
              )}
              {parsed.dueDate && (
                <span className="badge badge-due">{parsed.dueDate}</span>
              )}
            </div>
          </div>
        )}

        <div className="voice-actions">
          {voiceState === 'done' && (
            <>
              <button className="btn-secondary" onClick={handleReset}>Re-record</button>
              <button className="btn-primary" onClick={() => parsed && onConfirm(parsed)}>
                Add Todo
              </button>
            </>
          )}
          {voiceState === 'error' && (
            <button className="btn-secondary" onClick={handleReset}>Clear &amp; Retry</button>
          )}
        </div>
      </div>
    </div>
  );
}
