// Last Modified: 2025-11-23 17:30
/**
 * Voice Synthesis Demo Page
 * Demonstrates ElevenLabs text-to-speech integration
 */

import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { VoicePlayer } from '../components/voice/VoicePlayer';
import { Mic, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Voice {
  voiceId: string;
  name: string;
  category: string;
  description: string;
}

export function VoiceDemo() {
  const [text, setText] = useState('Hello from BollaLabz! This is a test of the ElevenLabs voice synthesis system.');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  const [settings, setSettings] = useState({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  });

  // Load available voices
  const loadVoices = async () => {
    setIsLoadingVoices(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/voice/voices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setVoices(data.data);
        if (data.data.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(data.data[0].voiceId);
        }
      } else {
        setError(data.message || 'Failed to load voices');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Generate speech
  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsLoading(true);
    setError('');
    setAudioUrl('');

    try {
      const response = await fetch(`${API_URL}/api/v1/voice/synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceId || undefined,
          settings
        })
      });

      const data = await response.json();

      if (data.success) {
        setAudioUrl(`${API_URL}${data.data.url}`);
        setFilename(data.data.filename);
      } else {
        setError(data.message || 'Failed to generate speech');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Load usage stats
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/voice/stats?days=7`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  React.useEffect(() => {
    loadVoices();
    loadStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mic className="h-8 w-8 text-indigo-500" />
        <div>
          <h1 className="text-3xl font-bold">Voice Synthesis Demo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert text to speech using ElevenLabs AI voices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Input */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="text">Text to Convert</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="mt-2"
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                {text.length} / 5000 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voice">Voice</Label>
                <select
                  id="voice"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="mt-2 w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  disabled={isLoadingVoices}
                >
                  {voices.map((voice) => (
                    <option key={voice.voiceId} value={voice.voiceId}>
                      {voice.name} ({voice.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="stability">Stability</Label>
                <Input
                  id="stability"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.stability}
                  onChange={(e) => setSettings({ ...settings, stability: parseFloat(e.target.value) })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="similarity">Similarity Boost</Label>
                <Input
                  id="similarity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.similarityBoost}
                  onChange={(e) => setSettings({ ...settings, similarityBoost: parseFloat(e.target.value) })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.style}
                  onChange={(e) => setSettings({ ...settings, style: parseFloat(e.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Generate Speech
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Audio Player */}
          {audioUrl && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Audio</h3>
              <VoicePlayer
                audioUrl={audioUrl}
                filename={filename}
                showWaveform={true}
              />
            </Card>
          )}
        </div>

        {/* Right column - Stats & Info */}
        <div className="space-y-6">
          {/* Usage Stats */}
          {stats && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Request</p>
                  <p className="text-xl font-semibold">${stats.avgCostPerRequest.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Characters Processed</p>
                  <p className="text-xl font-semibold">{stats.totalCharacters.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Generation Time</p>
                  <p className="text-xl font-semibold">{stats.avgGenerationTimeMs.toFixed(0)}ms</p>
                </div>
              </div>
              <Button
                onClick={loadStats}
                variant="outline"
                className="w-full mt-4"
              >
                Refresh Stats
              </Button>
            </Card>
          )}

          {/* Available Voices */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Voices</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoadingVoices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                voices.map((voice) => (
                  <div
                    key={voice.voiceId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVoiceId === voice.voiceId
                        ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedVoiceId(voice.voiceId)}
                  >
                    <p className="font-semibold">{voice.name}</p>
                    <p className="text-xs text-gray-500">{voice.category}</p>
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={loadVoices}
              variant="outline"
              className="w-full mt-4"
              disabled={isLoadingVoices}
            >
              {isLoadingVoices ? 'Loading...' : 'Refresh Voices'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default VoiceDemo;
