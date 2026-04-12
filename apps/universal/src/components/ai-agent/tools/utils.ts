export function safeParseJson<T = any>(value: any, fallback: T): T {
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function toTextResult(data: any) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

export function toErrorResult(err: any) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err?.message ?? err}` }],
    isError: true,
  };
}
