export function patch<T>(entity: T, thePatch: Partial<T>): T {
  Object.entries(thePatch)
    .filter(([, value]) => value !== undefined)
    .forEach(
      ([key, value]) =>
        // Typescript 3.5 prevent "unsound" writes
        ((entity as Record<string, unknown>)[key] = value)
    )

  return entity
}
