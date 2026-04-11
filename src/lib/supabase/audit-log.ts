import { supabase } from './client'

// ─── Label maps ────────────────────────────────────────────────────────────

export const ACTION_LABELS: Record<string, string> = {
  B2C_USER_REACTIVATED:       'B2C User Reactivated',
  B2C_USER_SUSPENDED:         'B2C User Suspended',
  CONTENT_ACTIVATED:          'Content Activated',
  CONTENT_ARCHIVED:           'Content Archived',
  CONTENT_RECLASSIFIED:       'Content Reclassified',
  CONTRACT_CREATED:           'Contract Created',
  CONTRACT_UPDATED:           'Contract Updated',
  LEARNER_ARCHIVED:           'Learner Archived',
  LEARNER_CREATED:            'Learner Created',
  LEARNER_HARD_DELETED:       'Learner Deleted (GDPR)',
  PLAN_ASSIGNED_TO_TENANT:    'Plan Assigned to Tenant',
  PLAN_CONTENT_ADDED:         'Content Added to Plan',
  PLAN_CONTENT_REMOVED:       'Content Removed from Plan',
  PLAN_CREATED:               'Plan Created',
  PLAN_PUBLISHED:             'Plan Published',
  PLAN_UNASSIGNED_FROM_TENANT:'Plan Unassigned from Tenant',
  PLAN_UPDATED:               'Plan Updated',
  ROLE_ASSIGNED:              'Role Assigned',
  TENANT_CREATED:             'Tenant Created',
  TENANT_DEACTIVATED:         'Tenant Deactivated',
  TENANT_REACTIVATED:         'Tenant Reactivated',
  TENANT_UPDATED:             'Tenant Updated',
}

export type ActionCategory = 'create' | 'update' | 'delete' | 'assign'

export const ACTION_CATEGORIES: Record<string, ActionCategory> = {
  B2C_USER_REACTIVATED:       'update',
  B2C_USER_SUSPENDED:         'delete',
  CONTENT_ACTIVATED:          'create',
  CONTENT_ARCHIVED:           'delete',
  CONTENT_RECLASSIFIED:       'update',
  CONTRACT_CREATED:           'create',
  CONTRACT_UPDATED:           'update',
  LEARNER_ARCHIVED:           'delete',
  LEARNER_CREATED:            'create',
  LEARNER_HARD_DELETED:       'delete',
  PLAN_ASSIGNED_TO_TENANT:    'assign',
  PLAN_CONTENT_ADDED:         'assign',
  PLAN_CONTENT_REMOVED:       'assign',
  PLAN_CREATED:               'create',
  PLAN_PUBLISHED:             'update',
  PLAN_UNASSIGNED_FROM_TENANT:'assign',
  PLAN_UPDATED:               'update',
  ROLE_ASSIGNED:              'assign',
  TENANT_CREATED:             'create',
  TENANT_DEACTIVATED:         'delete',
  TENANT_REACTIVATED:         'update',
  TENANT_UPDATED:             'update',
}

// Dual-casing entries are intentional — audit_logs.entity_type is not normalised in the DB
export const ENTITY_TYPE_LABELS: Record<string, string> = {
  tenant:       'Tenant',
  Tenant:       'Tenant',
  Plan:         'Plan',
  plan:         'Plan',
  ContentItem:  'Content Item',
  content_item: 'Content Item',
  Contract:     'Contract',
  AdminUser:    'Admin User',
  User:         'B2C User',
  Learner:      'Learner',
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getActionCategory(action: string): ActionCategory {
  return ACTION_CATEGORIES[action] ?? 'update'
}

function truncateUuid(id: string): string {
  return id.slice(0, 8) + '…'
}

// Entity types that resolve via the tenants table
const TENANT_ENTITY_TYPES = new Set(['tenant', 'Tenant', 'Contract'])
const PLAN_ENTITY_TYPES    = new Set(['Plan', 'plan'])
const CONTENT_ENTITY_TYPES = new Set(['ContentItem', 'content_item'])
const ADMIN_ENTITY_TYPES   = new Set(['AdminUser', 'admin_user'])
const USER_ENTITY_TYPES    = new Set(['User', 'user'])

// ─── Types ─────────────────────────────────────────────────────────────────

export type AuditLogEntry = {
  id: string
  timestamp: string
  actorName: string
  action: string
  actionLabel: string
  actionCategory: ActionCategory
  entityType: string
  entityTypeLabel: string
  entityName: string
  tenantId: string | null
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
}

// ─── Fetch ─────────────────────────────────────────────────────────────────

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })

  if (error) throw error
  if (!data || data.length === 0) return []

  // Collect entity IDs by type for batch resolution
  const tenantIds: string[]  = []
  const planIds: string[]    = []
  const contentIds: string[] = []
  const adminIds: string[]   = []
  const userIds: string[]    = []

  for (const e of data) {
    if (!e.entity_id) continue
    if (TENANT_ENTITY_TYPES.has(e.entity_type))  tenantIds.push(e.entity_id)
    else if (PLAN_ENTITY_TYPES.has(e.entity_type))    planIds.push(e.entity_id)
    else if (CONTENT_ENTITY_TYPES.has(e.entity_type)) contentIds.push(e.entity_id)
    else if (ADMIN_ENTITY_TYPES.has(e.entity_type))   adminIds.push(e.entity_id)
    else if (USER_ENTITY_TYPES.has(e.entity_type))    userIds.push(e.entity_id)
  }

  // Parallel batch lookups
  const unique = (arr: string[]) => [...new Set(arr)]

  const [tenants, plans, contentItems, adminUsers, users] = await Promise.all([
    tenantIds.length  ? supabase.from('tenants').select('id, name').in('id', unique(tenantIds))              : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    planIds.length    ? supabase.from('plans').select('id, name').in('id', unique(planIds))                   : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    contentIds.length ? supabase.from('assessment_items').select('id, title').in('id', unique(contentIds))       : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    adminIds.length   ? supabase.from('admin_users').select('id, name').in('id', unique(adminIds))            : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    userIds.length    ? supabase.from('users').select('id, display_name, email').in('id', unique(userIds))    : Promise.resolve({ data: [] as { id: string; display_name: string | null; email: string }[] }),
  ])

  // Build name lookup map
  const nameMap: Record<string, string> = {}
  for (const t of (tenants.data ?? []))        nameMap[t.id] = t.name
  for (const p of (plans.data ?? []))          nameMap[p.id] = p.name
  for (const c of (contentItems.data ?? []))   nameMap[c.id] = c.title
  for (const a of (adminUsers.data ?? []))     nameMap[a.id] = a.name
  for (const u of (users.data ?? []))          nameMap[u.id] = u.display_name ?? u.email

  return data.map((e) => ({
    id:              e.id,
    timestamp:       e.timestamp,
    actorName:       e.actor_name,
    action:          e.action,
    actionLabel:     getActionLabel(e.action),
    actionCategory:  getActionCategory(e.action),
    entityType:      e.entity_type ?? '',
    entityTypeLabel: ENTITY_TYPE_LABELS[e.entity_type ?? ''] ?? e.entity_type ?? '—',
    entityName:      e.entity_id ? (nameMap[e.entity_id] ?? truncateUuid(e.entity_id)) : '—',
    tenantId:        e.tenant_id ?? null,
    beforeState:     e.before_state ?? null,
    afterState:      e.after_state ?? null,
  }))
}
