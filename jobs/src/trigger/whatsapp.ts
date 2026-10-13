import { task } from "@trigger.dev/sdk";

export interface WhatsAppNotificationPayload {
  to: string;
  templateName: string;
  variables: Record<string, string>;
}

export const dispatchWhatsAppMessageTask = task({
  id: "dispatch-whatsapp-message",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: WhatsAppNotificationPayload) => {
    console.log(`[WhatsApp Dispatch] Queuing message to ${payload.to} with template ${payload.templateName}`);

    return {
      delivered: true,
      recipient: payload.to,
      template: payload.templateName,
      sentAt: new Date().toISOString(),
    };
  },
});
