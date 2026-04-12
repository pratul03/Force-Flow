export function renderTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_, key: string) => {
    const value = resolveTemplateValue(data, key);
    return value === undefined || value === null ? '' : String(value);
  });
}

function resolveTemplateValue(
  data: Record<string, unknown>,
  key: string,
): unknown {
  const parts = key.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
