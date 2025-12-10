"use client";

import { useState, useMemo } from "react";
import type { PhoneRecord, CallStatus } from "@repo/types";

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const PhoneIncomingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
  </svg>
);

const PhoneOutgoingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
  </svg>
);

const PhoneMissedIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

type DirectionFilter = "all" | "inbound" | "outbound";
type StatusFilter = "all" | "completed" | "missed";

// Mock data
const mockCalls: Partial<PhoneRecord>[] = [
  {
    id: "1",
    userId: "user1",
    phoneNumber: "+1 (555) 123-4567",
    contactId: "contact1",
    direction: "inbound",
    status: "completed",
    duration: 342,
    startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    recordingUrl: "https://example.com/recording1",
    transcriptId: "transcript1",
    provider: "twilio",
  },
  {
    id: "2",
    userId: "user1",
    phoneNumber: "+1 (555) 234-5678",
    direction: "outbound",
    status: "completed",
    duration: 128,
    startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    recordingUrl: "https://example.com/recording2",
    provider: "twilio",
  },
  {
    id: "3",
    userId: "user1",
    phoneNumber: "+1 (555) 345-6789",
    contactId: "contact2",
    direction: "inbound",
    status: "no-answer",
    duration: 0,
    startTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    provider: "twilio",
  },
  {
    id: "4",
    userId: "user1",
    phoneNumber: "+1 (555) 456-7890",
    direction: "outbound",
    status: "completed",
    duration: 567,
    startTime: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 231).toISOString(),
    recordingUrl: "https://example.com/recording4",
    transcriptId: "transcript4",
    provider: "twilio",
  },
  {
    id: "5",
    userId: "user1",
    phoneNumber: "+1 (555) 567-8901",
    contactId: "contact3",
    direction: "inbound",
    status: "completed",
    duration: 890,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 890).toISOString(),
    recordingUrl: "https://example.com/recording5",
    transcriptId: "transcript5",
    provider: "twilio",
  },
  {
    id: "6",
    userId: "user1",
    phoneNumber: "+1 (555) 678-9012",
    direction: "outbound",
    status: "busy",
    duration: 0,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    provider: "twilio",
  },
  {
    id: "7",
    userId: "user1",
    phoneNumber: "+1 (555) 789-0123",
    contactId: "contact4",
    direction: "inbound",
    status: "completed",
    duration: 1245,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 1245).toISOString(),
    recordingUrl: "https://example.com/recording7",
    transcriptId: "transcript7",
    provider: "twilio",
  },
];

// Mock transcription
const mockTranscription = `[0:00] Agent: Hello, thank you for calling. How can I help you today?

[0:05] Customer: Hi, I'm calling about my account. I received an email saying there was unusual activity.

[0:12] Agent: I understand your concern. Let me pull up your account. Can you please verify your email address?

[0:20] Customer: Sure, it's john.smith@example.com

[0:25] Agent: Thank you. I can see there was a login attempt from a new device yesterday. Was that you?

[0:32] Customer: Oh yes, that was me. I got a new phone and was setting it up.

[0:38] Agent: Great, that explains it. I'll mark this as verified. Is there anything else I can help you with today?

[0:45] Customer: No, that's all. Thank you for your help!

[0:48] Agent: You're welcome! Have a great day.`;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

function getCallIcon(direction: "inbound" | "outbound", status: CallStatus) {
  const isMissed = status === "no-answer" || status === "busy" || status === "failed";

  if (isMissed) {
    return <PhoneMissedIcon className="h-5 w-5 text-destructive" />;
  }

  if (direction === "inbound") {
    return <PhoneIncomingIcon className="h-5 w-5 text-success" />;
  }

  return <PhoneOutgoingIcon className="h-5 w-5 text-primary" />;
}

function getStatusLabel(status: CallStatus): string {
  switch (status) {
    case "completed":
      return "";
    case "no-answer":
      return "Missed";
    case "busy":
      return "Busy";
    case "failed":
      return "Failed";
    case "canceled":
      return "Cancelled";
    default:
      return "";
  }
}

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Partial<PhoneRecord> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const calls = mockCalls;

  const filteredCalls = useMemo(() => {
    let result = [...calls];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((call) => call.phoneNumber?.includes(query));
    }

    // Direction filter
    if (directionFilter !== "all") {
      result = result.filter((call) => call.direction === directionFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        result = result.filter((call) => call.status === "completed");
      } else {
        result = result.filter(
          (call) =>
            call.status === "no-answer" ||
            call.status === "busy" ||
            call.status === "failed"
        );
      }
    }

    return result;
  }, [calls, searchQuery, directionFilter, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Call History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your call recordings and transcriptions.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">New Call</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input hover:bg-muted transition-colors ${
            showFilters || directionFilter !== "all" || statusFilter !== "all"
              ? "bg-primary/10 border-primary/20 text-primary"
              : ""
          }`}
        >
          <FilterIcon className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="p-4 bg-card rounded-lg border border-border animate-fade-in">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Direction
              </label>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)}
                className="px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed/Failed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Call list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filteredCalls.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <PhoneIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calls found</p>
            {(searchQuery || directionFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDirectionFilter("all");
                  setStatusFilter("all");
                }}
                className="text-primary hover:underline text-sm mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredCalls.map((call) => {
              const statusLabel = getStatusLabel(call.status as CallStatus);
              const isSelected = selectedCall?.id === call.id;

              return (
                <div key={call.id}>
                  <div
                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-muted/50" : ""
                    }`}
                    onClick={() => setSelectedCall(isSelected ? null : call)}
                  >
                    {/* Direction icon */}
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        statusLabel
                          ? "bg-destructive/10"
                          : call.direction === "inbound"
                          ? "bg-success/10"
                          : "bg-primary/10"
                      }`}
                    >
                      {getCallIcon(
                        call.direction as "inbound" | "outbound",
                        call.status as CallStatus
                      )}
                    </div>

                    {/* Call info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {call.phoneNumber}
                        </p>
                        {statusLabel && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{call.direction}</span>
                        {call.duration && call.duration > 0 && (
                          <>
                            <span>-</span>
                            <span>{formatDuration(call.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    {call.startTime && (
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {formatDateTime(call.startTime)}
                      </span>
                    )}

                    {/* Recording indicator */}
                    {call.recordingUrl && (
                      <div className="flex items-center gap-1">
                        <PlayIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {call.transcriptId && (
                      <div className="flex items-center gap-1">
                        <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Expanded view */}
                  {isSelected && (
                    <div className="p-4 bg-muted/30 border-t border-border animate-fade-in">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Recording player */}
                        {call.recordingUrl && (
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-foreground mb-2">
                              Recording
                            </h3>
                            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                              <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                              >
                                {isPlaying ? (
                                  <PauseIcon className="h-5 w-5" />
                                ) : (
                                  <PlayIcon className="h-5 w-5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: isPlaying ? "35%" : "0%" }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {call.duration ? formatDuration(call.duration) : "0:00"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 lg:w-48">
                          <h3 className="text-sm font-medium text-foreground mb-1">
                            Actions
                          </h3>
                          <button
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                            onClick={() => console.log("Call back", call.phoneNumber)}
                          >
                            <PhoneIcon className="h-4 w-4" />
                            Call Back
                          </button>
                          {call.transcriptId && (
                            <button
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
                              onClick={() => setShowTranscript(!showTranscript)}
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                              {showTranscript ? "Hide" : "View"} Transcript
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transcription */}
                      {showTranscript && call.transcriptId && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium text-foreground mb-2">
                            Transcription
                          </h3>
                          <div className="p-4 bg-background rounded-lg border border-border max-h-64 overflow-y-auto">
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                              {mockTranscription}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
