import { Logger } from '@nestjs/common';
import { query } from '@anthropic-ai/claude-agent-sdk';

export interface RunAgentOptions {
  question: string;
  systemPrompt: string;
  mcpServer: any;
  mcpServerName: string;
  maxTurns?: number;
  logger: Logger;
  logLabel: string;
}

export async function runClaudeAgent(opts: RunAgentOptions): Promise<string> {
  const { question, systemPrompt, mcpServer, mcpServerName, maxTurns = 6, logger, logLabel } = opts;

  let finalText = '';

  try {
    const q = query({
      prompt: question,
      options: {
        systemPrompt,
        maxTurns,
        mcpServers: { [mcpServerName]: mcpServer },
        permissionMode: 'bypassPermissions' as const,
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const message of q) {
      if (message.type === 'assistant') {
        const content = (message as any).message?.content;
        if (!Array.isArray(content)) continue;

        for (const block of content) {
          if (typeof block !== 'object' || !block) continue;

          if ('type' in block && block.type === 'tool_use') {
            const toolBlock = block as { name: string };
            logger.log(`[${logLabel} Tool] ${toolBlock.name}`);
          }

          if ('type' in block && block.type === 'text') {
            const textBlock = block as { text: string };
            if (textBlock.text.trim()) {
              finalText = textBlock.text;
            }
          }
        }
      }

      if (message.type === 'result') {
        const result = message as Record<string, unknown>;
        logger.log(
          `[${logLabel} Complete] turns: ${result.num_turns}, cost: $${result.total_cost_usd}`,
        );
      }
    }
  } catch (error: any) {
    logger.error(`[${logLabel}] Claude error`, {
      message: error?.message,
      status: error?.status,
    });
    return buildAiErrorMessage(error);
  }

  return finalText || buildAiErrorMessage(null);
}

function buildAiErrorMessage(error: any): string {
  const msg = error?.message || '';
  const status = error?.status;
  const limited =
    status === 429 ||
    status === 529 ||
    status === 503 ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('529') ||
    msg.includes('overloaded') ||
    msg.includes('rate limit') ||
    msg.includes('quota');

  if (limited) {
    return [
      'The AI assistant has reached its usage limit. Please try again in a minute.',
      '',
      'AI 어시스턴트의 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
      '',
      "AI yordamchimiz foydalanish chegarasiga yetdi. Iltimos, bir daqiqadan so'ng qayta urinib ko'ring.",
    ].join('\n');
  }

  return [
    'The AI assistant is temporarily unavailable. Please try again later.',
    '',
    'AI 어시스턴트를 일시적으로 사용할 수 없습니다. 나중에 다시 시도해 주세요.',
    '',
    "AI yordamchi vaqtincha mavjud emas. Iltimos, keyinroq qayta urinib ko'ring.",
  ].join('\n');
}
