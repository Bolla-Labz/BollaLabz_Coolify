"use client";

import Link from "next/link";
import type { PhoneRecord, CallStatus } from "@repo/types";

// Icons
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

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

interface RecentCallsProps {
  calls?: PhoneRecord[];
  loading?: boolean;
  limit?: number;
}

// Mock data for demonstration
const mockCalls: Partial<PhoneRecord>[] = [
  {
    id: "1",
    phoneNumber: "+1 (555) 123-4567",
    direction: "inbound",
    status: "completed" as CallStatus,
    duration: 342, // 5:42
    startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    endTime: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    recordingUrl: "https://example.com/recording1",
  },
  {
    id: "2",
    phoneNumber: "+1 (555) 234-5678",
    direction: "outbound",
    status: "completed" as CallStatus,
    duration: 128, // 2:08
    startTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
  },
  {
    id: "3",
    phoneNumber: "+1 (555) 345-6789",
    direction: "inbound",
    status: "no-answer" as CallStatus,
    duration: 0,
    startTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "4",
    phoneNumber: "+1 (555) 456-7890",
    direction: "outbound",
    status: "completed" as CallStatus,
    duration: 567, // 9:27
    startTime: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 231).toISOString(),
    recordingUrl: "https://example.com/recording4",
  },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

function getCallIcon(
  direction: "inbound" | "outbound",
  status: CallStatus
): React.ReactNode {
  const isMissed = status === "no-answer" || status === "busy" || status === "failed";

  if (isMissed) {
    return <PhoneMissedIcon className="h-4 w-4 text-destructive" />;
  }

  if (direction === "inbound") {
    return <PhoneIncomingIcon className="h-4 w-4 text-success" />;
  }

  return <PhoneOutgoingIcon className="h-4 w-4 text-primary" />;
}

function getCallStatusText(status: CallStatus): string {
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

export function RecentCalls({
  calls,
  loading = false,
  limit = 4,
}: RecentCallsProps) {
  const displayCalls = calls || mockCalls.slice(0, limit);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-card-foreground">Recent Calls</h2>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-card-foreground">Recent Calls</h2>
        <Link
          href="/dashboard/calls"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {displayCalls.map((call) => {
          const statusText = getCallStatusText(call.status as CallStatus);
          const isMissed =
            call.status === "no-answer" ||
            call.status === "busy" ||
            call.status === "failed";

          return (
            <div
              key={call.id}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              {/* Call direction icon */}
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isMissed ? "bg-destructive/10" : "bg-muted"
                }`}
              >
                {getCallIcon(
                  call.direction as "inbound" | "outbound",
                  call.status as CallStatus
                )}
              </div>

              {/* Call info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {call.phoneNumber}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{call.direction}</span>
                  {statusText && (
                    <span className="text-destructive">{statusText}</span>
                  )}
                  {call.duration && call.duration > 0 && (
                    <span>{formatDuration(call.duration)}</span>
                  )}
                </div>
              </div>

              {/* Time */}
              {call.startTime && (
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(call.startTime)}
                </span>
              )}

              {/* Recording button */}
              {call.recordingUrl && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle playback
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  title="Play recording"
                >
                  <PlayIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {displayCalls.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>No recent calls</p>
        </div>
      )}
    </div>
  );
}
