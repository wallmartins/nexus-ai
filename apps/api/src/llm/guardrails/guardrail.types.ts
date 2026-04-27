export type GuardrailResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
