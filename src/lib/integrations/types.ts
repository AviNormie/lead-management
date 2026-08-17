/**
 * Integration provider interface (Phase 4+).
 * No provider implementations in Phase 1.
 */

export type IntegrationContext = {
  organizationId: string;
  integrationId: string;
};

export type NormalizedLead = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  sourceDetail?: string;
  raw?: Record<string, unknown>;
};

export interface IntegrationProvider {
  id: string;
  name: string;
  connect(ctx: IntegrationContext): Promise<void>;
  disconnect(ctx: IntegrationContext): Promise<void>;
  refreshToken(ctx: IntegrationContext): Promise<void>;
  validateConnection(ctx: IntegrationContext): Promise<boolean>;
  subscribeWebhooks?(ctx: IntegrationContext): Promise<void>;
  handleWebhook?(payload: unknown): Promise<void>;
  fetchLeads?(ctx: IntegrationContext): Promise<NormalizedLead[]>;
}
