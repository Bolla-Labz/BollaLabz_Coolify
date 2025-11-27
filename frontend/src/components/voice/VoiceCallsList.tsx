// Last Modified: 2025-11-23 17:30
/**
 * Voice Calls List Component
 * Display call history and transcripts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  DollarSign,
  FileText,
  Loader2,
} from 'lucide-react';
import { voiceCallService, VoiceCall } from '@/services/voiceCallService';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function VoiceCallsList() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setIsLoading(true);
      const { calls: data } = await voiceCallService.listCalls({ limit: 50 });
      setCalls(data);
    } catch (error) {
      console.error('Error loading calls:', error);
      toast.error('Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTranscript = async (call: VoiceCall) => {
    setSelectedCall(call);
    setIsTranscriptLoading(true);

    try {
      const data = await voiceCallService.getCallTranscript(call.callId);
      setTranscript(data.transcript || 'No transcript available');
    } catch (error) {
      console.error('Error loading transcript:', error);
      setTranscript('Failed to load transcript');
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      'in-progress': 'secondary',
      failed: 'destructive',
      initiated: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Voice Call History</CardTitle>
            <Button onClick={loadCalls} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {calls.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No calls recorded yet
                </div>
              ) : (
                calls.map((call) => (
                  <Card key={call.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          <div className="p-2 rounded-full bg-primary/10">
                            {call.direction === 'outbound' ? (
                              <PhoneOutgoing className="w-4 h-4 text-primary" />
                            ) : (
                              <PhoneIncoming className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {call.contactName || call.phoneNumber}
                              </p>
                              {getStatusBadge(call.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                              {call.duration && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {Math.floor(call.duration / 60)}:
                                  {(call.duration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                              {call.cost && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${call.cost.toFixed(4)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {call.transcript && (
                          <Button
                            onClick={() => handleViewTranscript(call)}
                            variant="ghost"
                            size="sm"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
            <DialogDescription>
              {selectedCall?.contactName || selectedCall?.phoneNumber} •{' '}
              {selectedCall?.createdAt &&
                format(new Date(selectedCall.createdAt), 'MMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            {isTranscriptLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Call Details */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Direction:</span>
                        <span className="ml-2 capitalize">{selectedCall?.direction}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className="ml-2 capitalize">{selectedCall?.status}</span>
                      </div>
                      {selectedCall?.duration && (
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2">
                            {Math.floor(selectedCall.duration / 60)}:
                            {(selectedCall.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      {selectedCall?.cost && (
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="ml-2">
                            ${selectedCall.cost.toFixed(4)} {selectedCall.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Transcript */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
