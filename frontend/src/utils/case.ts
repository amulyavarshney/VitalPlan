type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const toCamelKey = (key: string) =>
  key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

const toSnakeKey = (key: string) =>
  key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

export function keysToCamel<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToCamel(item)) as T;
  }

  if (input !== null && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        toCamelKey(key),
        keysToCamel(value),
      ])
    ) as T;
  }

  return input as T;
}

export function keysToSnake<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToSnake(item)) as T;
  }

  if (input !== null && typeof input === 'object' && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        toSnakeKey(key),
        keysToSnake(value),
      ])
    ) as T;
  }

  return input as T;
}

export type { JsonValue };
