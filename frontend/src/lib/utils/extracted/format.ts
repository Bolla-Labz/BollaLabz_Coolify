// Last Modified: 2025-11-23 17:30
/**
 * Formatting utility functions
 */

/**
 * Format duration in seconds to human-readable string
 * @example formatDuration(125) => "2 min"
 * @example formatDuration(3665) => "1 hr 1 min"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  return `${minutes} min`;
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  // Format as "Jan 7, 2023"
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date to standard display format
 * @example formatDate("2023-01-07") => "Jan 7, 2023"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format phone number to standard US format
 * @example formatPhoneNumber("+15156196701") => "+1 (515) 619-6701"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Check if it's a US number (country code 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(
      7
    )}`;
  }

  // Return as-is if not a standard US number
  return phone;
}

/**
 * Format currency
 * @example formatCurrency(9.99) => "$9.99"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format percentage
 * @example formatPercentage(0.85) => "85%"
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Truncate text with ellipsis
 * @example truncate("Long text here", 10) => "Long text..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Get initials from name
 * @example getInitials("John Doe") => "JD"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format rating with color
 */
export function getRatingColor(
  rating: number
): "green" | "yellow" | "red" | "gray" {
  if (rating >= 9.0) return "green";
  if (rating >= 7.0) return "yellow";
  if (rating >= 5.0) return "red";
  return "gray";
}

/**
 * Get status color
 */
export function getStatusColor(
  status: string
): "green" | "blue" | "yellow" | "red" | "gray" {
  const statusLower = status.toLowerCase();

  if (statusLower === "active" || statusLower === "completed")
    return "green";
  if (statusLower === "available" || statusLower === "in_progress")
    return "blue";
  if (statusLower === "pending" || statusLower === "warning")
    return "yellow";
  if (statusLower === "error" || statusLower === "failed") return "red";

  return "gray";
}
