export const TENANT_SLUG_MAP: Record<string, string> = {
  akash:    'ec1bc005-e76d-4208-ab0f-abe0d316e260',
  techcorp: '7caa0566-e31a-41b6-962d-30fb3d6cb011',
}

// CLIENT_ADMIN admin_users.id per tenant (for assigned_by in content_assignments)
export const CA_ADMIN_USER_MAP: Record<string, string> = {
  'ec1bc005-e76d-4208-ab0f-abe0d316e260': 'c0f26275-d060-4910-9e05-9fb126ef69e9', // Sandesh Banakar — Akash
  '7caa0566-e31a-41b6-962d-30fb3d6cb011': '450c5df0-2254-46f9-be68-599fdc9a9e46', // Priya Nair — TechCorp
}

export function getTenantId(slug: string): string | null {
  return TENANT_SLUG_MAP[slug] ?? null
}
