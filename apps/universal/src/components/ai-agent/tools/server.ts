import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { generalTools, GeneralModels } from './general-tools';
import { partnerTools, PartnerModels } from './partner-tools';
import { adminTools, AdminModels } from './admin-tools';

export function buildGeneralMcpServer(models: GeneralModels) {
  return createSdkMcpServer({
    name: 'lankastay-general-agent',
    version: '1.0.0',
    tools: generalTools(models) as any,
  });
}

export function buildPartnerMcpServer(models: PartnerModels, partnerId: string) {
  return createSdkMcpServer({
    name: 'lankastay-partner-agent',
    version: '1.0.0',
    tools: partnerTools(models, partnerId) as any,
  });
}

export function buildAdminMcpServer(models: AdminModels) {
  return createSdkMcpServer({
    name: 'lankastay-admin-agent',
    version: '1.0.0',
    tools: adminTools(models) as any,
  });
}
