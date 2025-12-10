// 09 December 2025 03 45 00

/**
 * Notification Worker
 * Sends notifications via email, SMS, push, or webhooks
 */

import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import { QUEUE_NAMES } from "../index";
import type { NotificationJobData, NotificationJobResult } from "../types";

/**
 * Process notification job
 * This is the main job processor - implement actual notification logic here
 */
async function processNotification(
  job: Job<NotificationJobData>
): Promise<NotificationJobResult> {
  const { type, userId, template, data, priority = "normal" } = job.data;
  const startTime = Date.now();

  console.log(
    `[Notification] Starting job ${job.id} - ${type} to user ${userId}`
  );

  try {
    await job.updateProgress(10);

    let result: NotificationJobResult;

    switch (type) {
      case "email":
        result = await sendEmailNotification(userId, template, data);
        break;
      case "sms":
        result = await sendSmsNotification(userId, template, data);
        break;
      case "push":
        result = await sendPushNotification(userId, template, data);
        break;
      case "webhook":
        result = await sendWebhookNotification(userId, template, data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    await job.updateProgress(100);

    const duration = Date.now() - startTime;
    console.log(
      `[Notification] Completed job ${job.id} in ${duration}ms (priority: ${priority})`
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Notification] Failed job ${job.id}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  userId: string,
  template: string,
  _data: Record<string, unknown>
): Promise<NotificationJobResult> {
  console.log(`[Notification] Sending email to user ${userId} (template: ${template})`);

  // TODO: Integrate with email service
  // - SendGrid
  // - Resend
  // - AWS SES
  // - Postmark

  return {
    delivered: true,
    channel: "email",
    messageId: `email-${Date.now()}`,
  };
}

/**
 * Format template string with data placeholders
 */
function formatTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] || ""));
}

/**
 * Send SMS notification using Twilio
 */
async function sendSmsNotification(
  userId: string,
  template: string,
  data: Record<string, unknown>
): Promise<NotificationJobResult> {
  console.log(`[Notification] Sending SMS to user ${userId} (template: ${template})`);

  const { getTwilioService } = await import("../../services/twilio");
  const twilio = getTwilioService();

  // Extract phone number from data
  const phoneNumber = data.phoneNumber as string;
  if (!phoneNumber) {
    throw new Error("Phone number required for SMS notification");
  }

  // Format message template
  const message = formatTemplate(template, data);

  // Send SMS via Twilio
  // Note: sendSMS returns the raw Twilio message object with .sid and .status properties
  // It throws an error on failure, so if we get here, it succeeded
  const twilioMessage = await twilio.sendSMS({
    to: phoneNumber,
    body: message,
  });

  // Twilio message object has .sid (message SID) and .status (e.g., 'queued', 'sent')
  // If sendSMS didn't throw, the message was accepted by Twilio
  if (!twilioMessage || !twilioMessage.sid) {
    throw new Error("SMS delivery failed: No message SID returned from Twilio");
  }

  return {
    delivered: true,
    channel: "sms",
    messageId: twilioMessage.sid,
  };
}

/**
 * Send push notification
 */
async function sendPushNotification(
  userId: string,
  template: string,
  _data: Record<string, unknown>
): Promise<NotificationJobResult> {
  console.log(`[Notification] Sending push to user ${userId} (template: ${template})`);

  // TODO: Integrate with push service
  // - Firebase Cloud Messaging (FCM)
  // - Apple Push Notification Service (APNS)
  // - OneSignal
  // - Pusher

  return {
    delivered: true,
    channel: "push",
    messageId: `push-${Date.now()}`,
  };
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  userId: string,
  template: string,
  _data: Record<string, unknown>
): Promise<NotificationJobResult> {
  console.log(`[Notification] Sending webhook for user ${userId} (template: ${template})`);

  // TODO: Implement webhook delivery
  // - Fetch user's webhook URL from database
  // - Sign payload with HMAC
  // - POST to webhook URL
  // - Handle retries

  return {
    delivered: true,
    channel: "webhook",
    messageId: `webhook-${Date.now()}`,
  };
}

/**
 * Create and start the notification worker
 */
export function createNotificationWorker(): Worker<
  NotificationJobData,
  NotificationJobResult
> {
  const worker = new Worker<NotificationJobData, NotificationJobResult>(
    QUEUE_NAMES.NOTIFICATION,
    processNotification,
    {
      connection: createRedisConnection(),
      concurrency: 10, // High concurrency for notifications
      lockDuration: 20000, // 20 seconds - notifications are fast
      limiter: {
        max: 50, // Max 50 notifications per duration
        duration: 1000, // Per second
      },
    }
  );

  // Event handlers
  worker.on("completed", (job, result) => {
    console.log(
      `[Notification Worker] Job ${job.id} completed via ${result.channel}`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[Notification Worker] Job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("error", (error) => {
    console.error("[Notification Worker] Worker error:", error);
  });

  console.log("[Notification Worker] Started");

  return worker;
}

export type { NotificationJobData, NotificationJobResult };
