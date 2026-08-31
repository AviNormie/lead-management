import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, type SendEmailResult } from "./send";

export type NotifyUserInput = {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Prisma.InputJsonValue;
  email?: {
    to?: string;
    subject: string;
    html: string;
    text?: string;
  };
};

export type NotifyUserResult = {
  notificationId: string;
  email: SendEmailResult | null;
};

/**
 * Create an in-app notification and optionally send email.
 * Soft-fails email; always attempts to persist the Notification row.
 */
export async function notifyUser(
  input: NotifyUserInput,
): Promise<NotifyUserResult> {
  const notification = await prisma.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? undefined,
    },
  });

  if (!input.email) {
    return { notificationId: notification.id, email: null };
  }

  let to = input.email.to;
  if (!to) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    to = user?.email;
  }

  if (!to) {
    return {
      notificationId: notification.id,
      email: {
        ok: false,
        skipped: true,
        reason: "User has no email address",
      },
    };
  }

  const emailResult = await sendEmail({
    to,
    subject: input.email.subject,
    html: input.email.html,
    text: input.email.text,
  });

  return { notificationId: notification.id, email: emailResult };
}
