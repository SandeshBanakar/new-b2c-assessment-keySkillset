export const TENANT_SLUG_MAP: Record<string, string> = {
  akash:    'ec1bc005-e76d-4208-ab0f-abe0d316e260',
  techcorp: '7caa0566-e31a-41b6-962d-30fb3d6cb011',
}

export function getTenantId(slug: string): string | null {
  return TENANT_SLUG_MAP[slug] ?? null
}
