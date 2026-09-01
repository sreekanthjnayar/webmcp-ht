export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

function write(level: LogLevel, message: string, extra?: LogFields) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...extra,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Structured JSON logs for Node and Edge runtimes. */
export const log = {
  info: (message: string, extra?: LogFields) => write("info", message, extra),
  warn: (message: string, extra?: LogFields) => write("warn", message, extra),
  error: (message: string, extra?: LogFields) => write("error", message, extra),
};
