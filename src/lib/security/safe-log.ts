const SENSITIVE_KEY =
  /password|passwd|secret|token|authorization|cookie|hash|api[_-]?key|api[_-]?secret|smtp_pass|patient_token/i;

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function redactForLog(value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    if (JWT_PATTERN.test(value) && value.length > 20) {
      return "[REDACTED_TOKEN]";
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactForLog(item));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactForLog(nested);
      }
    }
    return result;
  }

  return value;
}

export function safeWarn(message: string, meta?: Record<string, unknown>): void {
  if (meta) {
    console.warn(message, redactForLog(meta));
    return;
  }
  console.warn(message);
}

export function safeError(message: string, meta?: Record<string, unknown>): void {
  if (meta) {
    console.error(message, redactForLog(meta));
    return;
  }
  console.error(message);
}
