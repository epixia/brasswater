import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Key-casing utilities
// ---------------------------------------------------------------------------

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Recursively convert every key in an object (or array of objects)
 * from snake_case to camelCase.
 */
export function toCamel(obj) {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), toCamel(v)])
    );
  }
  return obj;
}

/**
 * Recursively convert every key in an object (or array of objects)
 * from camelCase to snake_case.
 */
export function toSnake(obj) {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [camelToSnake(k), toSnake(v)])
    );
  }
  return obj;
}

// ---------------------------------------------------------------------------
// ID generation helper
// ---------------------------------------------------------------------------

export function generateId(prefix) {
  const slug = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${slug}`;
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function handleResponse({ data, error }) {
  if (error) throw new Error(error.message);
  return toCamel(data);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function fetchUsers() {
  return handleResponse(await supabase.from('users').select('*'));
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

export async function fetchBuildings() {
  return handleResponse(await supabase.from('buildings').select('*'));
}

export async function fetchBuilding(id) {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function createBuilding(data) {
  const row = { id: generateId('bld'), ...toSnake(data) };
  return handleResponse(await supabase.from('buildings').insert(row).select());
}

export async function updateBuilding(id, data) {
  return handleResponse(
    await supabase.from('buildings').update(toSnake(data)).eq('id', id).select()
  );
}

// ---------------------------------------------------------------------------
// Inspection Templates
// ---------------------------------------------------------------------------

export async function fetchInspectionTemplates() {
  return handleResponse(
    await supabase.from('inspection_templates').select('*')
  );
}

// ---------------------------------------------------------------------------
// Scheduled Inspections
// ---------------------------------------------------------------------------

export async function fetchInspections(filters = {}) {
  let query = supabase
    .from('scheduled_inspections')
    .select(
      '*, buildings(name), inspection_templates(category_code, category_name)'
    );

  if (filters.buildingId) query = query.eq('building_id', filters.buildingId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.templateId) query = query.eq('template_id', filters.templateId);

  return handleResponse(await query);
}

export async function fetchInspection(id) {
  const { data, error } = await supabase
    .from('scheduled_inspections')
    .select(
      '*, buildings(name), inspection_templates(category_code, category_name)'
    )
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function createInspection(data) {
  const row = { id: generateId('insp'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('scheduled_inspections').insert(row).select()
  );
}

export async function updateInspection(id, data) {
  return handleResponse(
    await supabase
      .from('scheduled_inspections')
      .update(toSnake(data))
      .eq('id', id)
      .select()
  );
}

// ---------------------------------------------------------------------------
// Work Orders
// ---------------------------------------------------------------------------

export async function fetchWorkOrders(filters = {}) {
  let query = supabase.from('work_orders').select('*, buildings(name)');

  if (filters.buildingId) query = query.eq('building_id', filters.buildingId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.type) query = query.eq('type', filters.type);

  return handleResponse(await query);
}

export async function fetchWorkOrder(id) {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*, buildings(name)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function createWorkOrder(data) {
  const row = { id: generateId('wo'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('work_orders').insert(row).select()
  );
}

export async function updateWorkOrder(id, data) {
  return handleResponse(
    await supabase
      .from('work_orders')
      .update(toSnake(data))
      .eq('id', id)
      .select()
  );
}

// ---------------------------------------------------------------------------
// Contractors
// ---------------------------------------------------------------------------

export async function fetchContractors() {
  return handleResponse(await supabase.from('contractors').select('*'));
}

export async function createContractor(data) {
  const row = { id: generateId('ctr'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('contractors').insert(row).select()
  );
}

export async function updateContractor(id, data) {
  return handleResponse(
    await supabase
      .from('contractors')
      .update(toSnake(data))
      .eq('id', id)
      .select()
  );
}

// ---------------------------------------------------------------------------
// Compliance Requirements
// ---------------------------------------------------------------------------

export async function fetchCompliance(filters = {}) {
  let query = supabase
    .from('compliance_requirements')
    .select('*, buildings(name)');

  if (filters.buildingId) query = query.eq('building_id', filters.buildingId);
  if (filters.status) query = query.eq('status', filters.status);

  return handleResponse(await query);
}

export async function updateCompliance(id, data) {
  return handleResponse(
    await supabase
      .from('compliance_requirements')
      .update(toSnake(data))
      .eq('id', id)
      .select()
  );
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export async function fetchActivity(filters = {}) {
  const limit = filters.limit ?? 20;

  let query = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.buildingId) query = query.eq('building_id', filters.buildingId);

  return handleResponse(await query);
}

export async function createActivity(data) {
  const row = { id: generateId('act'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('activity_log').insert(row).select()
  );
}

// ---------------------------------------------------------------------------
// Inventory Categories
// ---------------------------------------------------------------------------

export async function fetchInventoryCategories() {
  return handleResponse(
    await supabase.from('inventory_categories').select('*')
  );
}

// ---------------------------------------------------------------------------
// Inventory Items
// ---------------------------------------------------------------------------

export async function fetchInventoryItems(filters = {}) {
  let query = supabase.from('inventory_items').select('*');

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.location) query = query.eq('last_location', filters.location);
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%`
    );
  }

  return handleResponse(await query);
}

export async function fetchInventoryItem(id) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return toCamel(data);
}

export async function createInventoryItem(data) {
  const row = { id: generateId('inv'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('inventory_items').insert(row).select()
  );
}

export async function updateInventoryItem(id, data) {
  return handleResponse(
    await supabase
      .from('inventory_items')
      .update(toSnake(data))
      .eq('id', id)
      .select()
  );
}

// ---------------------------------------------------------------------------
// Checkout History
// ---------------------------------------------------------------------------

export async function fetchCheckoutHistory(itemId) {
  let query = supabase
    .from('checkout_history')
    .select('*, inventory_items(name, asset_tag)')
    .order('date', { ascending: false });

  if (itemId) query = query.eq('item_id', itemId);

  return handleResponse(await query);
}

export async function createCheckoutEntry(data) {
  const row = { id: generateId('chk'), ...toSnake(data) };
  return handleResponse(
    await supabase.from('checkout_history').insert(row).select()
  );
}

// ---------------------------------------------------------------------------
// Dashboard Stats
// ---------------------------------------------------------------------------

export async function fetchDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
  const today = now.toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [
    buildingsRes,
    inspectionsThisMonthRes,
    overdueInspectionsRes,
    openWorkOrdersRes,
    complianceAllRes,
    complianceCompliantRes,
    upcomingInspectionsRes,
    recentActivityRes,
  ] = await Promise.all([
    // Count of buildings
    supabase.from('buildings').select('id', { count: 'exact', head: true }),

    // Inspections this month
    supabase
      .from('scheduled_inspections')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_date', startOfMonth)
      .lte('scheduled_date', endOfMonth),

    // Overdue inspections
    supabase
      .from('scheduled_inspections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'overdue'),

    // Open work orders (not completed or closed)
    supabase
      .from('work_orders')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("completed","closed")'),

    // Total compliance requirements
    supabase
      .from('compliance_requirements')
      .select('id', { count: 'exact', head: true }),

    // Compliant requirements
    supabase
      .from('compliance_requirements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'compliant'),

    // Upcoming inspections (next 7 days with building name)
    supabase
      .from('scheduled_inspections')
      .select('*, buildings(name)')
      .gte('scheduled_date', today)
      .lte('scheduled_date', nextWeek)
      .order('scheduled_date', { ascending: true }),

    // Recent activity (last 10)
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Check for errors
  const responses = [
    buildingsRes,
    inspectionsThisMonthRes,
    overdueInspectionsRes,
    openWorkOrdersRes,
    complianceAllRes,
    complianceCompliantRes,
    upcomingInspectionsRes,
    recentActivityRes,
  ];
  for (const res of responses) {
    if (res.error) throw new Error(res.error.message);
  }

  const totalCompliance = complianceAllRes.count || 0;
  const compliantCount = complianceCompliantRes.count || 0;
  const complianceRate =
    totalCompliance > 0
      ? Math.round((compliantCount / totalCompliance) * 100)
      : 100;

  return {
    buildingCount: buildingsRes.count || 0,
    inspectionsThisMonth: inspectionsThisMonthRes.count || 0,
    overdueInspections: overdueInspectionsRes.count || 0,
    openWorkOrders: openWorkOrdersRes.count || 0,
    complianceRate,
    upcomingInspections: toCamel(upcomingInspectionsRes.data),
    recentActivity: toCamel(recentActivityRes.data),
  };
}
