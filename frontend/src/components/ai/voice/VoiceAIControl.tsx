// Last Modified: 2025-11-23 17:30
/**
 * VoiceAIControl Component
 * Advanced voice control with waveform visualization, transcription, and AI integration
 * Supports real-time voice commands and natural language processing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  StopCircle,
  Settings,
  Headphones,
  Radio,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { useWebSocket } from '@/lib/websocket/useWebSocket';

// ============================================
// TYPES
// ============================================

export interface VoiceAIControlProps {
  // Configuration
  apiKey?: string;
  model?: 'whisper' | 'google-speech' | 'azure-speech';
  language?: string;
  voiceProvider?: 'elevenlabs' | 'google-tts' | 'azure-tts';
  voiceId?: string;

  // Features
  features?: {
    waveform?: boolean;
    transcription?: boolean;
    commands?: boolean;
    voiceEffects?: boolean;
    noiseReduction?: boolean;
    voiceSynthesis?: boolean;
    realtime?: boolean;
    hotword?: boolean;
    continuousListening?: boolean;
  };

  // UI Options
  variant?: 'default' | 'minimal' | 'compact' | 'floating' | 'call';
  size?: 'sm' | 'md' | 'lg';
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';

  // Callbacks
  onTranscription?: (text: string, confidence: number) => void;
  onCommand?: (command: string, params: any) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: Error) => void;
  onVoiceDetected?: () => void;
  onSilenceDetected?: () => void;

  // Commands configuration
  commands?: Array<{
    pattern: string | RegExp;
    action: (params?: any) => void;
    description?: string;
  }>;

  className?: string;
}

export interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isConnected: boolean;
  volume: number;
  transcription: string;
  confidence: number;
  error?: string;
}

// ============================================
// WAVEFORM VISUALIZER
// ============================================

const WaveformVisualizer: React.FC<{
  isActive: boolean;
  audioData?: Uint8Array;
  color?: string;
  height?: number;
}> = ({ isActive, audioData, color = '#3b82f6', height = 60 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isActive && audioData) {
        // Draw waveform
        const barWidth = 3;
        const barGap = 2;
        const bars = Math.floor(canvas.width / (window.devicePixelRatio * (barWidth + barGap)));

        for (let i = 0; i < bars; i++) {
          const dataIndex = Math.floor((i / bars) * audioData.length);
          const barHeight = ((audioData[dataIndex] ?? 0) / 255) * height * 0.8;

          const x = i * (barWidth + barGap);
          const y = (height - barHeight) / 2;

          // Gradient effect
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, color + '80');
          gradient.addColorStop(1, color);

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else {
        // Draw idle animation
        const time = Date.now() / 1000;
        const bars = Math.floor(canvas.width / (window.devicePixelRatio * 5));

        for (let i = 0; i < bars; i++) {
          const amplitude = Math.sin(time * 2 + i * 0.5) * 0.3 + 0.5;
          const barHeight = amplitude * height * 0.3;

          const x = i * 5;
          const y = (height - barHeight) / 2;

          ctx.fillStyle = color + '40';
          ctx.fillRect(x, y, 3, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioData, color, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
};

// ============================================
// VOICE LEVEL INDICATOR
// ============================================

const VoiceLevelIndicator: React.FC<{
  level: number;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ level, isActive, size = 'md' }) => {
  const sizes = {
    sm: 'w-32 h-1',
    md: 'w-48 h-2',
    lg: 'w-64 h-3',
  };

  return (
    <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizes[size])}>
      <motion.div
        className={cn(
          'h-full rounded-full',
          isActive
            ? level > 0.7 ? 'bg-red-500' : level > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
            : 'bg-gray-400'
        )}
        animate={{ width: `${level * 100}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const VoiceAIControl: React.FC<VoiceAIControlProps> = ({
  apiKey,
  model = 'whisper',
  language = 'en-US',
  voiceProvider = 'elevenlabs',
  voiceId,
  features = {
    waveform: true,
    transcription: true,
    commands: true,
    voiceSynthesis: true,
    realtime: true,
  },
  variant = 'default',
  size = 'md',
  position = 'center',
  theme = 'auto',
  onTranscription,
  onCommand,
  onStateChange,
  onError,
  onVoiceDetected,
  onSilenceDetected,
  commands = [],
  className,
}) => {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isConnected: false,
    volume: 0,
    transcription: '',
    confidence: 0,
  });

  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time processing
  const { send, subscribe, isConnected } = useWebSocket({
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
  });

  useEffect(() => {
    setState(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: features.noiseReduction,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;

      source.connect(analyser);
      analyserRef.current = analyser;

      // Start volume monitoring
      monitorVolume();

      return stream;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [features.noiseReduction, onError]);

  // Monitor audio volume
  const monitorVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const monitor = () => {
      if (!analyserRef.current || !state.isListening) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      setAudioData(dataArray);

      // Calculate volume level
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
      setState(prev => ({ ...prev, volume }));

      // Detect voice/silence
      if (volume > 0.1) {
        onVoiceDetected?.();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            onSilenceDetected?.();
          }, 2000);
        }
      }

      requestAnimationFrame(monitor);
    };

    monitor();
  }, [state.isListening, onVoiceDetected, onSilenceDetected]);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      const stream = await initAudioContext();

      // Create media recorder for audio capture
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);

          // Send for real-time transcription if enabled
          if (features.realtime && isConnected) {
            const reader = new FileReader();
            reader.onloadend = () => {
              send({
                type: 'voice.audio',
                payload: {
                  audio: reader.result,
                  model,
                  language,
                },
              });
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(features.realtime ? 250 : undefined); // Chunk every 250ms for real-time

      setState(prev => ({
        ...prev,
        isListening: true,
        transcription: '',
        error: undefined,
      }));

      onStateChange?.(state);
    } catch (error) {
      console.error('Failed to start listening:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to access microphone',
      }));
      onError?.(error as Error);
    }
  }, [initAudioContext, features.realtime, isConnected, model, language, send, onStateChange, state, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isListening: false,
      volume: 0,
    }));

    onStateChange?.(state);
  }, [state, onStateChange]);

  // Process audio
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Simulate API call for transcription
      await new Promise(resolve => setTimeout(resolve, 1000));

      const transcription = 'This is a simulated transcription of your voice input.';
      const confidence = 0.95;

      setState(prev => ({
        ...prev,
        transcription,
        confidence,
        isProcessing: false,
      }));

      onTranscription?.(transcription, confidence);

      // Process commands if enabled
      if (features.commands && commands.length > 0) {
        processCommands(transcription);
      }
    } catch (error) {
      console.error('Failed to process audio:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to process audio',
        isProcessing: false,
      }));
      onError?.(error as Error);
    }
  }, [features.commands, commands, onTranscription, onError]);

  // Process voice commands
  const processCommands = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim();

    for (const command of commands) {
      const pattern = command.pattern instanceof RegExp
        ? command.pattern
        : new RegExp(command.pattern, 'i');

      const match = normalizedText.match(pattern);
      if (match) {
        onCommand?.(normalizedText, match);
        command.action(match);
        break;
      }
    }
  }, [commands, onCommand]);

  // Subscribe to real-time transcription
  useEffect(() => {
    if (!features.realtime || !isConnected) return;

    const unsubscribe = subscribe('voice.transcription', (data: any) => {
      setState(prev => ({
        ...prev,
        transcription: data.text,
        confidence: data.confidence,
      }));

      if (data.isFinal) {
        onTranscription?.(data.text, data.confidence);
        if (features.commands) {
          processCommands(data.text);
        }
      }
    });

    return unsubscribe;
  }, [features.realtime, features.commands, isConnected, subscribe, onTranscription, processCommands]);

  // Speak text using voice synthesis
  const speak = useCallback(async (text: string) => {
    if (!features.voiceSynthesis) return;

    setState(prev => ({ ...prev, isSpeaking: true }));

    try {
      if ('speechSynthesis' in window) {
        // Use browser's speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.onend = () => {
          setState(prev => ({ ...prev, isSpeaking: false }));
        };
        speechSynthesis.speak(utterance);
      } else if (isConnected) {
        // Use server-side TTS
        send({
          type: 'voice.synthesize',
          payload: {
            text,
            provider: voiceProvider,
            voiceId,
            language,
          },
        });
      }
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      setState(prev => ({ ...prev, isSpeaking: false }));
      onError?.(error as Error);
    }
  }, [features.voiceSynthesis, language, isConnected, voiceProvider, voiceId, send, onError]);

  // Render based on variant
  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className="flex items-center gap-2">
            <InteractiveButton
              variant={state.isListening ? 'primary' : 'ghost'}
              size={size}
              icon={state.isListening ? MicOff : Mic}
              onClick={state.isListening ? stopListening : startListening}
              loading={state.isProcessing}
              className={cn(
                state.isListening && 'animate-pulse',
                state.error && 'border-red-500'
              )}
            />
            {state.transcription && showTranscription && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                {state.transcription}
              </motion.div>
            )}
          </div>
        );

      case 'compact':
        return (
          <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <InteractiveButton
              variant={state.isListening ? 'primary' : 'secondary'}
              size="sm"
              icon={state.isListening ? MicOff : Mic}
              onClick={state.isListening ? stopListening : startListening}
              loading={state.isProcessing}
            />
            <VoiceLevelIndicator level={state.volume} isActive={state.isListening} size="sm" />
            {state.isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
          </div>
        );

      case 'call':
        return (
          <div className="flex flex-col items-center gap-4 p-6">
            <div className="relative">
              <motion.div
                animate={{
                  scale: state.isListening ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  repeat: state.isListening ? Infinity : 0,
                  duration: 2,
                }}
                className={cn(
                  'w-24 h-24 rounded-full flex items-center justify-center',
                  state.isListening
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'
                )}
              >
                {state.isListening ? (
                  <PhoneCall className="w-12 h-12 text-white" />
                ) : (
                  <PhoneOff className="w-12 h-12 text-white" />
                )}
              </motion.div>
              {state.isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-24 h-24 text-blue-500 animate-spin" />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {state.isListening ? 'Listening...' : 'Tap to start'}
              </p>
              {state.transcription && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-xs">
                  {state.transcription}
                </p>
              )}
            </div>

            <button
              onClick={state.isListening ? stopListening : startListening}
              className={cn(
                'px-8 py-3 rounded-full font-medium transition-colors',
                state.isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {state.isListening ? 'End Call' : 'Start Call'}
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900 dark:text-white">Voice Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                {state.isConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    <span className="text-xs">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>
            </div>

            {/* Waveform */}
            {features.waveform && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <WaveformVisualizer
                  isActive={state.isListening}
                  audioData={audioData}
                  color={state.isListening ? '#10b981' : '#6b7280'}
                  height={60}
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {features.voiceSynthesis && state.transcription && (
                <InteractiveButton
                  variant="ghost"
                  icon={state.isSpeaking ? VolumeX : Volume2}
                  onClick={() => speak(state.transcription)}
                  tooltip="Play transcription"
                />
              )}

              <button
                onClick={state.isListening ? stopListening : startListening}
                disabled={state.isProcessing}
                className={cn(
                  'relative w-20 h-20 rounded-full transition-all',
                  'flex items-center justify-center',
                  state.isListening
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700',
                  state.isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                {state.isProcessing ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : state.isListening ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>

              <InteractiveButton
                variant="ghost"
                icon={Settings}
                onClick={() => setIsExpanded(!isExpanded)}
                tooltip="Settings"
              />
            </div>

            {/* Volume indicator */}
            <VoiceLevelIndicator level={state.volume} isActive={state.isListening} size="md" />

            {/* Transcription */}
            {features.transcription && state.transcription && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {state.confidence > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {(state.confidence * 100).toFixed(0)}% confident
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {state.transcription}
                </p>
              </motion.div>
            )}

            {/* Error message */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-400">{state.error}</span>
              </motion.div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn(
      'voice-ai-control',
      variant === 'floating' && 'fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4',
      variant === 'floating' && position === 'bottom-right' && 'bottom-4 right-4',
      variant === 'floating' && position === 'bottom-left' && 'bottom-4 left-4',
      variant === 'floating' && position === 'top-right' && 'top-4 right-4',
      variant === 'floating' && position === 'top-left' && 'top-4 left-4',
      className
    )}>
      {renderContent()}
    </div>
  );
};

export default VoiceAIControl;