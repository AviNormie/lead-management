import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe("email client + send", () => {
  beforeEach(() => {
    sendMock.mockReset();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("isEmailConfigured is false without env", async () => {
    const { isEmailConfigured } = await import("@/lib/email/client");
    expect(isEmailConfigured()).toBe(false);
  });

  it("isEmailConfigured is true when both env vars set", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "IntraCore <onboarding@resend.dev>";
    const { isEmailConfigured } = await import("@/lib/email/client");
    expect(isEmailConfigured()).toBe(true);
  });

  it("sendEmail skips when not configured", async () => {
    const { sendEmail } = await import("@/lib/email/send");
    const result = await sendEmail({
      to: "a@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
    });
    expect(result).toEqual({
      ok: false,
      skipped: true,
      reason: "RESEND_API_KEY or RESEND_FROM_EMAIL not configured",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sendEmail calls Resend when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "IntraCore <onboarding@resend.dev>";
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });

    const { sendEmail } = await import("@/lib/email/send");
    const result = await sendEmail({
      to: "a@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result).toEqual({ ok: true, id: "email_1" });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "IntraCore <onboarding@resend.dev>",
        to: "a@example.com",
        subject: "Hi",
      }),
    );
  });
});

describe("email templates", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  });

  it("builds invitation email with invite URL", async () => {
    const { memberInvitationEmail } = await import("@/lib/email/templates");
    const tpl = memberInvitationEmail({
      organizationName: "Acme",
      roleName: "Admin",
      inviteUrl: "http://localhost:3000/accept-invite?token=abc",
      invitedByName: "Avi",
    });
    expect(tpl.subject).toContain("Acme");
    expect(tpl.html).toContain("accept-invite?token=abc");
    expect(tpl.text).toContain("Admin");
  });

  it("builds lead assigned email with lead link", async () => {
    const { leadAssignedEmail } = await import("@/lib/email/templates");
    const tpl = leadAssignedEmail({
      leadName: "Jane Doe",
      leadId: "lead_1",
      organizationName: "Acme",
      assignedByName: "Avi",
    });
    expect(tpl.subject).toContain("Jane Doe");
    expect(tpl.html).toContain("/leads/lead_1");
  });
});

describe("notifyUser", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("creates a notification and skips email when not configured", async () => {
    const create = vi.fn().mockResolvedValue({ id: "notif_1" });
    const findUnique = vi.fn().mockResolvedValue({ email: "u@example.com" });

    vi.doMock("@/lib/db/prisma", () => ({
      prisma: {
        notification: { create },
        user: { findUnique },
      },
    }));

    const { notifyUser } = await import("@/lib/email/notify");
    const result = await notifyUser({
      organizationId: "org_1",
      userId: "00000000-0000-0000-0000-000000000001",
      type: "lead.assigned",
      title: "Lead assigned",
      body: "You have a new lead",
      data: { leadId: "lead_1" },
      email: {
        subject: "Lead assigned",
        html: "<p>Lead</p>",
        text: "Lead",
      },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org_1",
          type: "lead.assigned",
          title: "Lead assigned",
        }),
      }),
    );
    expect(result.notificationId).toBe("notif_1");
    expect(result.email).toEqual({
      ok: false,
      skipped: true,
      reason: "RESEND_API_KEY or RESEND_FROM_EMAIL not configured",
    });
  });
});
