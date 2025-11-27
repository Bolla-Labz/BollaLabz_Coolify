// Last Modified: 2025-11-23 17:30
/**
 * Voice Call Button Component
 * Initiates voice calls via Vapi
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneCall, PhoneOff, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { voiceCallService, VoiceCall } from '@/services/voiceCallService';
import { toast } from 'sonner';

interface VoiceCallButtonProps {
  phoneNumber: string;
  contactName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

type CallStatus = 'idle' | 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'failed';

export function VoiceCallButton({
  phoneNumber,
  contactName,
  variant = 'outline',
  size = 'sm',
  className = '',
}: VoiceCallButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [call, setCall] = useState<VoiceCall | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const handleInitiateCall = async () => {
    setCallStatus('initiating');

    try {
      const newCall = await voiceCallService.initiateCall(phoneNumber);
      setCall(newCall);
      setCallStatus('ringing');

      toast.success('Call initiated', {
        description: `Calling ${contactName || phoneNumber}...`,
      });

      // Simulate call progression (in production, this would be driven by webhooks)
      setTimeout(() => {
        setCallStatus('in-progress');
      }, 3000);
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallStatus('failed');

      toast.error('Call failed', {
        description: error instanceof Error ? error.message : 'Failed to initiate call',
      });
    }
  };

  const handleEndCall = () => {
    setCallStatus('completed');
    setTimeout(() => {
      setIsOpen(false);
      setCallStatus('idle');
      setCall(null);
      setLiveTranscript('');
    }, 2000);
  };

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case 'ringing':
        return 'bg-blue-500';
      case 'in-progress':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: CallStatus) => {
    switch (status) {
      case 'initiating':
        return 'Initiating...';
      case 'ringing':
        return 'Ringing...';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
        disabled={callStatus !== 'idle'}
      >
        {callStatus === 'initiating' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PhoneCall className="w-4 h-4" />
        )}
        {size !== 'icon' && <span className="ml-2">Call</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Call</DialogTitle>
            <DialogDescription>
              {contactName || phoneNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Call Status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(callStatus)} animate-pulse`} />
                    <span className="font-medium">{getStatusText(callStatus)}</span>
                  </div>
                  <Badge variant="outline">{phoneNumber}</Badge>
                </div>

                {call && (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div>Call ID: {call.callId}</div>
                    {call.duration && <div>Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</div>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Transcript */}
            {callStatus === 'in-progress' && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-medium mb-2">Live Transcript</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {liveTranscript ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {liveTranscript}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Listening...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Call Actions */}
            <div className="flex gap-2">
              {callStatus === 'idle' && (
                <Button
                  onClick={handleInitiateCall}
                  className="flex-1"
                  disabled={callStatus !== 'idle'}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Start Call
                </Button>
              )}

              {(callStatus === 'ringing' || callStatus === 'in-progress') && (
                <Button
                  onClick={handleEndCall}
                  variant="destructive"
                  className="flex-1"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}

              {(callStatus === 'completed' || callStatus === 'failed') && (
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setCallStatus('idle');
                    setCall(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
