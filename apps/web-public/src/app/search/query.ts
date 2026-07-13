export type RawSearchParams = Record<string, string | string[] | undefined>;

function toSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function toggledHref(current: RawSearchParams, key: string, value: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const single = toSingle(v);
    if (single !== undefined) params.set(k, single);
  }
  if (toSingle(current[key]) === value) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  return `/search?${params.toString()}`;
}

export function getParam(current: RawSearchParams, key: string): string | undefined {
  return toSingle(current[key]);
}

export function isActive(current: RawSearchParams, key: string, value: string): boolean {
  return getParam(current, key) === value;
}

export function setParamHref(current: RawSearchParams, key: string, value: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const single = toSingle(v);
    if (single !== undefined) params.set(k, single);
  }
  params.set(key, value);
  return `/search?${params.toString()}`;
}
