-- ============================================================================
-- BrassWater CMMS - Full Database Schema & Seed Data
-- Supabase Migration (idempotent)
-- ============================================================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS checkout_history CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_categories CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS compliance_requirements CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS scheduled_inspections CASCADE;
DROP TABLE IF EXISTS inspection_templates CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

CREATE TABLE users (
  id text PRIMARY KEY,
  name text,
  email text,
  role text,
  avatar_color text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE buildings (
  id text PRIMARY KEY,
  name text,
  address text,
  city text,
  postal_code text,
  year_built int,
  last_renovation int,
  total_area_sqft int,
  num_floors int,
  num_units int,
  has_elevator boolean,
  elevator_type text,
  has_parking boolean,
  parking_type text,
  has_pool boolean,
  has_sprinklers boolean,
  fire_detection text,
  accessibility text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE inspection_templates (
  id text PRIMARY KEY,
  category_code text,
  category_name text,
  description text,
  frequency text,
  requires_contractor boolean,
  requires_certificate boolean,
  applicable_standard text,
  checklist jsonb
);

CREATE TABLE scheduled_inspections (
  id text PRIMARY KEY,
  building_id text REFERENCES buildings(id),
  template_id text REFERENCES inspection_templates(id),
  assigned_to text,
  status text,
  scheduled_date date,
  completed_date date,
  overall_rating int,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE contractors (
  id text PRIMARY KEY,
  company_name text,
  contact_name text,
  phone text,
  email text,
  service_type text,
  license_number text,
  contract_number text,
  contract_start date,
  contract_end date,
  status text,
  notes text
);

CREATE TABLE work_orders (
  id text PRIMARY KEY,
  building_id text REFERENCES buildings(id),
  title text,
  description text,
  type text,
  status text,
  requested_by text,
  assigned_to text,
  requires_escort boolean,
  is_in_house boolean,
  contractor_id text,
  priority int,
  created_at timestamptz DEFAULT now(),
  scheduled_date date,
  completed_date date,
  satisfaction_rating int,
  satisfaction_notes text
);

CREATE TABLE compliance_requirements (
  id text PRIMARY KEY,
  building_id text REFERENCES buildings(id),
  requirement_name text,
  standard_code text,
  description text,
  frequency text,
  last_completed date,
  next_due date,
  status text,
  responsible_party text
);

CREATE TABLE activity_log (
  id text PRIMARY KEY,
  building_id text,
  user_id text,
  action text,
  entity_type text,
  entity_id text,
  details text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE inventory_categories (
  id text PRIMARY KEY,
  name text,
  color text
);

CREATE TABLE inventory_items (
  id text PRIMARY KEY,
  name text,
  asset_tag text UNIQUE,
  category text REFERENCES inventory_categories(id),
  status text DEFAULT 'available',
  condition text DEFAULT 'good',
  unit_cost numeric(10,2),
  last_location text REFERENCES buildings(id),
  checked_out_by text,
  checked_out_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE checkout_history (
  id text PRIMARY KEY,
  item_id text REFERENCES inventory_items(id),
  action text,
  user_id text,
  date timestamptz,
  notes text,
  return_location text,
  return_condition text
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_history ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon role (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "anon_all_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_buildings" ON buildings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_inspection_templates" ON inspection_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_scheduled_inspections" ON scheduled_inspections FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_contractors" ON contractors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_work_orders" ON work_orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_compliance_requirements" ON compliance_requirements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_activity_log" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_inventory_categories" ON inventory_categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_inventory_items" ON inventory_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_checkout_history" ON checkout_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- Also allow authenticated role
CREATE POLICY "auth_all_users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_buildings" ON buildings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_inspection_templates" ON inspection_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_scheduled_inspections" ON scheduled_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_contractors" ON contractors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_work_orders" ON work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_compliance_requirements" ON compliance_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_activity_log" ON activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_inventory_categories" ON inventory_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_inventory_items" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_checkout_history" ON checkout_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Users
INSERT INTO users (id, name, email, role, avatar_color) VALUES
  ('usr-1', 'Marc Lefebvre', 'marc.lefebvre@brasswater.ca', 'admin', '#3b82f6'),
  ('usr-2', 'Sophie Tremblay', 'sophie.tremblay@brasswater.ca', 'property_manager', '#8b5cf6'),
  ('usr-3', 'Jean-Pierre Dubois', 'jp.dubois@brasswater.ca', 'maintenance_staff', '#22c55e'),
  ('usr-4', 'Isabelle Roy', 'isabelle.roy@brasswater.ca', 'inspector', '#f59e0b');

-- Buildings
INSERT INTO buildings (id, name, address, city, postal_code, year_built, total_area_sqft, num_floors, num_units, has_elevator, elevator_type, has_parking, parking_type, has_pool, has_sprinklers) VALUES
  ('bld-1', 'Résidence des Érables', '4500 Boulevard Saint-Laurent, Montréal, QC H2T 1R3', 'Montréal', 'H2T 1R3', 2008, 155000, 12, 120, true, 'hydraulic', true, 'underground', true, true),
  ('bld-2', 'Le Château Saint-Laurent', '250 Grande Allée Est, Québec, QC G1R 2H4', 'Québec', 'G1R 2H4', 2015, 99000, 8, 85, true, 'traction', true, 'underground', false, true),
  ('bld-3', 'Domaine du Parc', '1800 Boulevard Le Corbusier, Laval, QC H7S 2K1', 'Laval', 'H7S 2K1', 1998, 55000, 5, 45, true, 'hydraulic', true, 'outdoor', false, false);

-- Inspection Templates
INSERT INTO inspection_templates (id, category_code, category_name, description, frequency, requires_contractor, requires_certificate, applicable_standard, checklist) VALUES
  ('tpl-a10', 'A10', 'Foundations', 'Foundation, garage, and basement inspection covering structural integrity, waterproofing, and drainage systems.', 'semi-annual', false, false, NULL,
   '[{"item":"Inspect concrete for cracks or spalling","category":"Structure"},{"item":"Verify waterproofing membrane integrity","category":"Waterproofing"},{"item":"Check for moisture infiltration or efflorescence","category":"Moisture"},{"item":"Inspect exposed steel for corrosion","category":"Structure"},{"item":"Examine wall coverings and coatings","category":"Finishes"},{"item":"Test garage ventilation system","category":"Ventilation"},{"item":"Inspect garage door operation and safety sensors","category":"Doors"},{"item":"Verify sump pump operation and float switch","category":"Drainage"},{"item":"Perform spring cleaning of drainage channels","category":"Drainage"}]'::jsonb),

  ('tpl-b10', 'B10', 'Interior Structure', 'Interior structural elements including floors, walls, columns, and expansion joints.', 'annual', false, false, NULL,
   '[{"item":"Check for floor movement or deflection","category":"Floors"},{"item":"Inspect for structural deformation","category":"Structure"},{"item":"Document cracks in wall and ceiling finishes","category":"Walls"},{"item":"Look for delamination of surface materials","category":"Surfaces"},{"item":"Check for humidity stains or water damage","category":"Moisture"},{"item":"Inspect for mold growth or musty odors","category":"Air Quality"},{"item":"Verify caulking around penetrations","category":"Sealing"},{"item":"Document any visible prior repairs","category":"Documentation"},{"item":"Inspect expansion joints for deterioration","category":"Joints"}]'::jsonb),

  ('tpl-b20', 'B20', 'Exterior Envelope / Facades', 'Building envelope including masonry, cladding, windows, balconies, and attached elements. Subject to Loi 122 facade inspection every 5 years.', 'semi-annual', true, true, 'Loi 122 (Bill 122) - Facade safety inspection every 5 years',
   '[{"item":"Inspect mortar joints for cracks or erosion","category":"Masonry"},{"item":"Check for brick bulging or displacement","category":"Masonry"},{"item":"Examine exterior cladding attachment","category":"Cladding"},{"item":"Document fissures or surface degradation","category":"Surface"},{"item":"Inspect window glass for cracks or seal failure","category":"Windows"},{"item":"Check curtain wall frames and gaskets","category":"Windows"},{"item":"Verify sealant joints at transitions","category":"Sealing"},{"item":"Inspect balcony slabs and waterproofing","category":"Balconies"},{"item":"Test guardrail stability and anchorage","category":"Safety"},{"item":"Inspect attached elements (signs, lights, anchors)","category":"Attachments"}]'::jsonb),

  ('tpl-b30', 'B30', 'Roofing', 'Roof membrane, flashings, drains, and all rooftop mechanical penetrations.', 'semi-annual', true, false, NULL,
   '[{"item":"Inspect membrane for degradation or blistering","category":"Membrane"},{"item":"Check for material cracking or splitting","category":"Membrane"},{"item":"Verify flashings are secure and sealed","category":"Flashings"},{"item":"Clear blocked roof drains and scuppers","category":"Drainage"},{"item":"Check for water accumulation (ponding)","category":"Drainage"},{"item":"Remove vegetation growth on membrane","category":"Membrane"},{"item":"Inspect sealing around mechanical box penetrations","category":"Penetrations"},{"item":"Check for missing or damaged shingles","category":"Coverings"},{"item":"Verify all unfixed elements are secured","category":"Safety"},{"item":"Remove debris and clean roof surface","category":"Maintenance"}]'::jsonb),

  ('tpl-c10', 'C10', 'Interior Finishes', 'Interior finishes in common areas including walls, ceilings, floors, stairs, and railings.', 'annual', false, false, NULL,
   '[{"item":"Inspect wall and ceiling finishes for deterioration","category":"Walls/Ceilings"},{"item":"Check for finish cracks or peeling paint","category":"Walls/Ceilings"},{"item":"Look for discoloration or staining","category":"Walls/Ceilings"},{"item":"Check for humidity damage or mold","category":"Air Quality"},{"item":"Verify wall-mounted elements are secure","category":"Attachments"},{"item":"Inspect floor coverings for damage or wear","category":"Floors"},{"item":"Check baseboard condition and attachment","category":"Trim"},{"item":"Inspect stair treads and nosings","category":"Stairs"},{"item":"Test handrail stability","category":"Safety"},{"item":"Verify guardrail height and spacing compliance","category":"Safety"}]'::jsonb),

  ('tpl-d10', 'D10', 'Elevators', 'Elevator equipment, cab condition, and safety devices. Inspections range from weekly visual to quarterly professional.', 'weekly/monthly/quarterly', true, true, 'CAN/CSA-B44 Safety Code for Elevators',
   '[{"item":"Weekly: Verify cab lighting and ventilation","category":"Weekly"},{"item":"Weekly: Check door operation and sensors","category":"Weekly"},{"item":"Weekly: Test emergency phone/intercom","category":"Weekly"},{"item":"Weekly: Inspect cab floor and walls for damage","category":"Weekly"},{"item":"Monthly: Check leveling accuracy at each floor","category":"Monthly"},{"item":"Monthly: Listen for unusual noises during travel","category":"Monthly"},{"item":"Monthly: Inspect machine room temperature and cleanliness","category":"Monthly"},{"item":"Quarterly: Professional maintenance by certified technician","category":"Quarterly"},{"item":"Quarterly: Test emergency braking system","category":"Quarterly"},{"item":"Quarterly: Inspect wire ropes or hydraulic cylinders","category":"Quarterly"}]'::jsonb),

  ('tpl-d20', 'D20', 'Plumbing', 'Plumbing systems including water supply, hot water, pumps, drainage, and specialty equipment.', 'weekly/monthly', false, false, NULL,
   '[{"item":"Verify main water valve accessibility and operation","category":"Water Supply"},{"item":"Inspect boiler room for leaks or corrosion","category":"Heating"},{"item":"Check hot water tank temperature and relief valve","category":"Hot Water"},{"item":"Test circulating pumps and pressure gauges","category":"Pumps"},{"item":"Verify glycol system concentration (if applicable)","category":"Heating"},{"item":"Inspect kitchen equipment connections (commercial)","category":"Equipment"},{"item":"Check gas appliance venting and connections","category":"Gas"},{"item":"Verify sump pit and ejector pump operation","category":"Drainage"},{"item":"Inspect grease trap and schedule cleaning","category":"Drainage"}]'::jsonb),

  ('tpl-d30', 'D30', 'HVAC', 'Heating, ventilation, and air conditioning systems including rooftop units, air handlers, and exhaust fans.', 'weekly/monthly/annual', true, false, NULL,
   '[{"item":"Check ventilation elements for proper airflow","category":"Ventilation"},{"item":"Verify garage heating system operation","category":"Heating"},{"item":"Inspect lobby and corridor heating","category":"Heating"},{"item":"Replace filters and inspect belts (monthly)","category":"Maintenance"},{"item":"Test kitchen exhaust ventilation","category":"Ventilation"},{"item":"Inspect mechanical room for leaks or vibration","category":"Equipment"},{"item":"Check compressor operation and refrigerant levels","category":"Cooling"},{"item":"Inspect rooftop A/C units and condensate drains","category":"Cooling"},{"item":"Test air exchangers and HRV units","category":"Ventilation"}]'::jsonb),

  ('tpl-d40', 'D40', 'Fire Protection', 'Fire safety systems: sprinklers, alarms, extinguishers, emergency lighting, and smoke/heat detectors. The most detailed inspection category.', 'weekly/monthly/quarterly/annual', true, true, 'NFPA 25 / CAN/ULC-S536 / NFPA 72',
   '[{"item":"Weekly: Verify sprinkler control valves are open","category":"Weekly"},{"item":"Weekly: Test emergency lighting operation","category":"Weekly"},{"item":"Weekly: Check fire pump pressure gauges","category":"Weekly"},{"item":"Monthly: Run fire pump test for 10 minutes","category":"Monthly"},{"item":"Monthly: Test fire alarm panel and communicator","category":"Monthly"},{"item":"Monthly: Verify fire department phone connection","category":"Monthly"},{"item":"Quarterly: Inspect all portable fire extinguishers","category":"Quarterly"},{"item":"Quarterly: Test smoke and heat detectors (sample)","category":"Quarterly"},{"item":"Quarterly: Test manual pull stations (sample)","category":"Quarterly"},{"item":"Annual: Full fire alarm system verification (CAN/ULC-S536)","category":"Annual"},{"item":"Annual: Sprinkler system full inspection (NFPA 25)","category":"Annual"},{"item":"Annual: Test fire door hold-open devices","category":"Annual"}]'::jsonb),

  ('tpl-d50', 'D50', 'Electrical', 'Electrical systems, panels, emergency generators, and stairwell lighting.', 'weekly', true, true, 'CAN/CSA-C282 Emergency Generator',
   '[{"item":"Verify electrical room cleanliness and access","category":"Rooms"},{"item":"Inspect panels for signs of overheating or damage","category":"Panels"},{"item":"Check for signs of overheating on connections","category":"Safety"},{"item":"Ensure electrical room ventilation is adequate","category":"Ventilation"},{"item":"Test emergency stairwell lighting","category":"Emergency"},{"item":"Generator: Check fuel level and top up","category":"Generator"},{"item":"Generator: Verify oil and coolant levels","category":"Generator"},{"item":"Generator: Inspect battery and charge level","category":"Generator"},{"item":"Generator: Check belts and hoses","category":"Generator"},{"item":"Generator: Verify alarm panel connection","category":"Generator"}]'::jsonb),

  ('tpl-g20', 'G20', 'Exterior / Landscaping', 'Exterior grounds including parking, landscaping, lighting, fencing, and pedestrian surfaces.', 'semi-annual', false, false, NULL,
   '[{"item":"Inspect parking surface for cracks and potholes","category":"Parking"},{"item":"Verify signage and lane striping condition","category":"Parking"},{"item":"Inspect trees for dead branches or disease","category":"Landscaping"},{"item":"Check terrain grading and drainage","category":"Landscaping"},{"item":"Inspect ponds, fountains, or water features","category":"Water Features"},{"item":"Test exterior lighting fixtures and timers","category":"Lighting"},{"item":"Inspect fencing and gates for damage","category":"Perimeter"},{"item":"Check pedestrian surfaces for trip hazards","category":"Walkways"}]'::jsonb);

-- Contractors
INSERT INTO contractors (id, company_name, contact_name, phone, email, service_type, license_number, status, notes) VALUES
  ('ctr-1', 'Sécurité Incendie Québec', 'Pierre Gagnon', '(514) 555-0101', 'info@siq-fire.ca', 'Fire Protection', 'RBQ-5678-1234-01', 'active', 'Reliable fire protection contractor. Serves all 3 buildings.'),
  ('ctr-2', 'Ascenseurs Montréal Inc.', 'Marie-Claude Bergeron', '(514) 555-0202', 'service@ascenseursmtl.ca', 'Elevators', 'RBQ-4321-5678-02', 'active', 'Exclusive elevator maintenance provider for our portfolio.'),
  ('ctr-3', 'Plomberie Pro-Tec', 'Alain Bouchard', '(450) 555-0303', 'urgence@protec-plomberie.ca', 'Plumbing', 'RBQ-9876-5432-03', 'active', '24/7 emergency service available.'),
  ('ctr-4', 'Climatisation Nordique', 'Sylvie Morin', '(514) 555-0404', 'service@climnordique.ca', 'HVAC', 'RBQ-1122-3344-04', 'active', 'Handles all HVAC maintenance and installations.'),
  ('ctr-5', 'Toitures Excellence', 'François Lavoie', '(418) 555-0505', 'soumission@toitures-exc.ca', 'Roofing', 'RBQ-5566-7788-05', 'active', 'Specialized in flat roof commercial/residential.'),
  ('ctr-6', 'Électricité Savard', 'Daniel Savard', '(450) 555-0606', 'contact@elec-savard.ca', 'Electrical', 'RBQ-2233-4455-06', 'expired', 'Contract expired November 2025. Renewal pending.');

-- Scheduled Inspections
INSERT INTO scheduled_inspections (id, building_id, template_id, assigned_to, status, scheduled_date, completed_date, overall_rating, notes) VALUES
  ('ins-1', 'bld-1', 'tpl-a10', 'usr-4', 'completed', '2026-02-15', '2026-02-15', 4, 'Minor hairline crack found in garage level B2 wall. Monitoring recommended. All sump pumps operational.'),
  ('ins-2', 'bld-1', 'tpl-b20', 'usr-4', 'completed', '2026-02-20', '2026-02-21', 3, 'Several mortar joints on north facade showing erosion. Balcony sealant on floors 8-10 needs replacement within 6 months. Guardrails secure.'),
  ('ins-3', 'bld-2', 'tpl-b30', 'usr-4', 'completed', '2026-02-25', '2026-02-25', 5, 'Roof membrane in excellent condition. All drains clear. Flashings secure. No ponding observed.'),
  ('ins-4', 'bld-1', 'tpl-d40', 'usr-4', 'completed', '2026-03-01', '2026-03-01', 4, 'All fire safety systems operational. One emergency light on floor 6 had dead battery - replaced on site. Sprinkler valve #3 slightly stiff, work order created.'),
  ('ins-5', 'bld-2', 'tpl-d10', NULL, 'scheduled', '2026-03-25', NULL, NULL, NULL),
  ('ins-6', 'bld-1', 'tpl-d50', 'usr-3', 'completed', '2026-03-05', '2026-03-05', 4, 'Electrical rooms clean and accessible. Generator fuel at 48% - work order created for fuel delivery. Battery charge normal.'),
  ('ins-7', 'bld-3', 'tpl-c10', 'usr-4', 'completed', '2026-03-08', '2026-03-08', 2, 'Significant wear on 3rd and 4th floor corridor carpets. Water stain on 2nd floor ceiling near stairwell - possible roof leak above. Handrails on stairwell B loose.'),
  ('ins-8', 'bld-1', 'tpl-d20', 'usr-3', 'completed', '2026-03-10', '2026-03-10', 3, 'Hot water tank #2 showing early corrosion at base. Grease trap needs cleaning. All pumps operational. Main valve accessible.'),
  ('ins-9', 'bld-1', 'tpl-d30', NULL, 'scheduled', '2026-03-28', NULL, NULL, NULL),
  ('ins-10', 'bld-3', 'tpl-g20', 'usr-4', 'overdue', '2026-03-15', NULL, NULL, NULL),
  ('ins-11', 'bld-2', 'tpl-b10', 'usr-4', 'scheduled', '2026-04-01', NULL, NULL, NULL),
  ('ins-12', 'bld-2', 'tpl-d40', NULL, 'scheduled', '2026-04-05', NULL, NULL, NULL),
  ('ins-13', 'bld-3', 'tpl-a10', 'usr-4', 'in_progress', '2026-03-22', NULL, NULL, 'Started inspection. Garage level complete, moving to basement areas.'),
  ('ins-14', 'bld-3', 'tpl-d40', 'usr-4', 'overdue', '2026-03-10', NULL, NULL, NULL),
  ('ins-15', 'bld-2', 'tpl-b20', NULL, 'scheduled', '2026-04-10', NULL, NULL, NULL),
  ('ins-16', 'bld-3', 'tpl-d50', 'usr-3', 'completed', '2026-03-12', '2026-03-12', 3, 'Generator battery showing signs of age. Recommend replacement within 2 months. All panels in order.');

-- Work Orders
INSERT INTO work_orders (id, building_id, title, description, type, status, requested_by, assigned_to, contractor_id, priority, created_at, scheduled_date, completed_date) VALUES
  ('wo-1', 'bld-1', 'Emergency: Water leak in unit 405 ceiling', 'Tenant reports active water dripping from living room ceiling. Possible pipe burst in unit 505 above. Immediate containment needed.', 'emergency', 'in_progress', 'usr-2', 'usr-3', 'ctr-3', 5, '2026-03-23T08:15:00Z', NULL, NULL),
  ('wo-2', 'bld-1', 'Garage door motor replacement', 'Main garage entrance door motor is intermittently failing. Door gets stuck at half-open position. Second occurrence this month.', 'priority', 'approved', 'usr-2', 'usr-3', NULL, 4, '2026-03-20T14:00:00Z', NULL, NULL),
  ('wo-3', 'bld-2', 'Annual fire panel inspection', 'Scheduled annual CAN/ULC-S536 fire alarm system verification. Contractor Sécurité Incendie Québec to perform full system test.', 'maintenance', 'assigned', 'usr-2', NULL, 'ctr-1', 3, '2026-03-18T09:00:00Z', NULL, NULL),
  ('wo-4', 'bld-1', 'Lobby carpet replacement', 'Main lobby carpet shows significant wear and staining. Replace with commercial-grade carpet tiles as per the approved renovation plan.', 'routine', 'submitted', 'usr-2', NULL, NULL, 2, '2026-03-22T16:30:00Z', NULL, NULL),
  ('wo-5', 'bld-2', 'Elevator vibration complaint - Unit 8B', 'Resident in unit 8B reports excessive vibration and noise from elevator shaft. Possible guide rail misalignment. Contractor inspection required.', 'priority', 'acknowledged', 'usr-4', NULL, 'ctr-2', 4, '2026-03-21T11:45:00Z', NULL, NULL),
  ('wo-6', 'bld-3', 'Replace broken window - 3rd floor corridor', 'Corridor window on 3rd floor has a crack from thermal stress. Not an immediate safety issue but needs replacement before next winter.', 'routine', 'approved', 'usr-2', 'usr-3', NULL, 2, '2026-03-15T13:00:00Z', NULL, NULL),
  ('wo-7', 'bld-1', 'HVAC filter change - all units', 'Quarterly HVAC filter replacement for all corridor and common area air handlers across the building.', 'maintenance', 'completed', 'usr-2', 'usr-3', 'ctr-4', 3, '2026-03-01T08:00:00Z', NULL, '2026-03-08'),
  ('wo-8', 'bld-3', 'Parking lot crack sealing', 'Multiple cracks in exterior parking lot surface require sealing before spring thaw causes further deterioration.', 'routine', 'completed', 'usr-2', 'usr-3', NULL, 2, '2026-02-25T10:00:00Z', NULL, '2026-03-05'),
  ('wo-9', 'bld-1', 'Generator fuel level low', 'Weekly check revealed generator diesel tank below 50%. Schedule fuel delivery before next scheduled load test.', 'priority', 'in_progress', 'usr-3', 'usr-3', NULL, 4, '2026-03-22T07:30:00Z', NULL, NULL),
  ('wo-10', 'bld-1', 'Sprinkler valve #3 stuck', 'During weekly valve check, sprinkler control valve #3 (zone 3, floors 4-6) found stuck in partially closed position. Requires immediate attention.', 'emergency', 'completed', 'usr-3', NULL, 'ctr-1', 5, '2026-03-19T06:45:00Z', NULL, '2026-03-19'),
  ('wo-11', 'bld-3', 'Exterior light pole damaged', 'Light pole near south entrance struck by snow plow. Pole is tilted and wiring may be exposed. Area cordoned off.', 'priority', 'assigned', 'usr-2', 'usr-3', 'ctr-6', 4, '2026-03-16T15:00:00Z', NULL, NULL),
  ('wo-12', 'bld-2', 'Grease trap cleaning overdue', 'Grease trap in building commercial kitchen has not been cleaned in 3 months. Exceeds municipal bylaw maximum interval of 90 days.', 'maintenance', 'acknowledged', 'usr-4', NULL, 'ctr-3', 3, '2026-03-20T10:30:00Z', NULL, NULL),
  ('wo-13', 'bld-2', 'Roof drain blockage after storm', 'Heavy rainstorm caused debris accumulation in two roof drains. Water ponding observed on northeast section of flat roof.', 'priority', 'closed', 'usr-3', 'usr-3', 'ctr-5', 4, '2026-03-10T07:00:00Z', NULL, '2026-03-11'),
  ('wo-14', 'bld-1', 'Pool pH level out of range', 'Weekly water quality test shows pH at 8.2, above acceptable range. Chemical adjustment and retest required.', 'maintenance', 'closed', 'usr-3', 'usr-3', NULL, 3, '2026-03-12T09:00:00Z', NULL, '2026-03-12');

-- Compliance Requirements
INSERT INTO compliance_requirements (id, building_id, requirement_name, standard_code, description, frequency, last_completed, next_due, status, responsible_party) VALUES
  ('comp-1', 'bld-1', 'Loi 122 Facade Inspection', 'Bill 122 / RBQ', 'Mandatory facade safety inspection for buildings 5+ storeys.', '5 years', '2023-06-15', '2028-06-15', 'compliant', 'Groupe-ABS Engineering'),
  ('comp-2', 'bld-1', 'NFPA 25 Sprinkler Inspection', 'NFPA 25', 'Annual inspection and testing of sprinkler systems.', 'annual', '2025-09-20', '2026-09-20', 'compliant', 'Sécurité Incendie Québec'),
  ('comp-3', 'bld-1', 'CAN/ULC-S536 Fire Alarm Verification', 'CAN/ULC-S536', 'Annual fire alarm system verification by certified technician.', 'annual', '2025-11-10', '2026-11-10', 'compliant', 'Sécurité Incendie Québec'),
  ('comp-4', 'bld-1', 'CAN/CSA-C282 Emergency Generator', 'CAN/CSA-C282', 'Semi-annual emergency generator load test and inspection.', 'semi-annual', '2025-12-01', '2026-06-01', 'due_soon', 'Électricité Savard'),
  ('comp-5', 'bld-1', 'Elevator Safety Certificate', 'CAN/CSA-B44', 'Annual elevator safety certification by licensed inspector.', 'annual', '2025-08-15', '2026-08-15', 'compliant', 'Ascenseurs Montréal Inc.'),
  ('comp-6', 'bld-1', 'Pool Water Quality', 'MAPAQ / Municipal Bylaw', 'Weekly pool water quality testing and chemical balance.', 'weekly', '2026-03-21', '2026-03-28', 'compliant', 'In-house maintenance'),
  ('comp-7', 'bld-2', 'Loi 122 Facade Inspection', 'Bill 122 / RBQ', 'Mandatory facade safety inspection for buildings 5+ storeys.', '5 years', '2021-04-20', '2026-04-20', 'due_soon', 'TBD - Engineering firm to be retained'),
  ('comp-8', 'bld-2', 'NFPA 25 Sprinkler Inspection', 'NFPA 25', 'Annual inspection and testing of sprinkler systems.', 'annual', '2025-07-10', '2026-07-10', 'compliant', 'Sécurité Incendie Québec'),
  ('comp-9', 'bld-2', 'CAN/ULC-S536 Fire Alarm Verification', 'CAN/ULC-S536', 'Annual fire alarm system verification by certified technician.', 'annual', '2025-05-22', '2026-05-22', 'due_soon', 'Sécurité Incendie Québec'),
  ('comp-10', 'bld-2', 'Elevator Safety Certificate', 'CAN/CSA-B44', 'Annual elevator safety certification by licensed inspector.', 'annual', '2025-10-05', '2026-10-05', 'compliant', 'Ascenseurs Montréal Inc.'),
  ('comp-11', 'bld-3', 'Loi 122 Facade Inspection', 'Bill 122 / RBQ', 'Mandatory facade safety inspection for buildings 5+ storeys.', '5 years', '2020-03-10', '2025-03-10', 'non_compliant', 'OVERDUE - Must schedule immediately. Potential fine from RBQ.'),
  ('comp-12', 'bld-3', 'NFPA 20 Fire Pump Test', 'NFPA 20', 'Annual fire pump flow test.', 'annual', '2025-04-15', '2026-04-15', 'due_soon', 'Sécurité Incendie Québec'),
  ('comp-13', 'bld-3', 'CAN/ULC-S536 Fire Alarm Verification', 'CAN/ULC-S536', 'Annual fire alarm system verification by certified technician.', 'annual', '2025-01-20', '2026-01-20', 'overdue', 'Sécurité Incendie Québec - scheduling delayed'),
  ('comp-14', 'bld-3', 'Elevator Safety Certificate', 'CAN/CSA-B44', 'Annual elevator safety certification by licensed inspector.', 'annual', '2025-06-30', '2026-06-30', 'compliant', 'Ascenseurs Montréal Inc.');

-- Activity Log
INSERT INTO activity_log (id, building_id, user_id, action, entity_type, entity_id, details, created_at) VALUES
  ('act-1', 'bld-1', 'usr-4', 'inspection_completed', 'inspection', 'ins-1', 'Completed foundation inspection at Résidence des Érables', '2026-02-15T16:30:00Z'),
  ('act-2', 'bld-1', 'usr-4', 'inspection_completed', 'inspection', 'ins-2', 'Completed facade inspection at Résidence des Érables - deficiencies noted', '2026-02-21T15:00:00Z'),
  ('act-3', 'bld-2', 'usr-4', 'inspection_completed', 'inspection', 'ins-3', 'Completed roofing inspection at Le Château Saint-Laurent - all clear', '2026-02-25T14:45:00Z'),
  ('act-4', 'bld-1', 'usr-4', 'inspection_completed', 'inspection', 'ins-4', 'Completed fire protection inspection at Résidence des Érables', '2026-03-01T17:00:00Z'),
  ('act-5', 'bld-3', 'usr-2', 'work_order_created', 'work_order', 'wo-8', 'Created work order: Parking lot crack sealing', '2026-02-25T10:00:00Z'),
  ('act-6', 'bld-1', 'usr-3', 'work_order_completed', 'work_order', 'wo-7', 'Completed work order: HVAC filter change - all units', '2026-03-08T16:00:00Z'),
  ('act-7', 'bld-1', 'usr-3', 'inspection_completed', 'inspection', 'ins-6', 'Completed electrical inspection at Résidence des Érables', '2026-03-05T15:30:00Z'),
  ('act-8', 'bld-3', 'usr-3', 'work_order_completed', 'work_order', 'wo-8', 'Completed work order: Parking lot crack sealing', '2026-03-05T14:30:00Z'),
  ('act-9', 'bld-3', 'usr-4', 'inspection_completed', 'inspection', 'ins-7', 'Completed interior finishes inspection at Domaine du Parc - poor condition noted', '2026-03-08T17:00:00Z'),
  ('act-10', 'bld-1', 'usr-3', 'inspection_completed', 'inspection', 'ins-8', 'Completed plumbing inspection at Résidence des Érables', '2026-03-10T16:00:00Z'),
  ('act-11', 'bld-2', 'usr-3', 'work_order_created', 'work_order', 'wo-13', 'Created work order: Roof drain blockage after storm', '2026-03-10T07:00:00Z'),
  ('act-12', 'bld-2', 'usr-3', 'work_order_completed', 'work_order', 'wo-13', 'Completed work order: Roof drain blockage after storm', '2026-03-11T16:00:00Z'),
  ('act-13', 'bld-1', 'usr-3', 'work_order_completed', 'work_order', 'wo-14', 'Completed work order: Pool pH level out of range', '2026-03-12T15:00:00Z'),
  ('act-14', 'bld-3', 'usr-3', 'inspection_completed', 'inspection', 'ins-16', 'Completed electrical inspection at Domaine du Parc', '2026-03-12T16:30:00Z'),
  ('act-15', 'bld-3', 'usr-2', 'work_order_created', 'work_order', 'wo-6', 'Created work order: Replace broken window - 3rd floor corridor', '2026-03-15T13:00:00Z'),
  ('act-16', 'bld-3', 'usr-2', 'work_order_created', 'work_order', 'wo-11', 'Created work order: Exterior light pole damaged', '2026-03-16T15:00:00Z'),
  ('act-17', 'bld-3', 'usr-2', 'compliance_updated', 'compliance', 'comp-13', 'Updated compliance status: CAN/ULC-S536 at Domaine du Parc marked overdue', '2026-03-18T09:00:00Z'),
  ('act-18', 'bld-1', 'usr-3', 'work_order_completed', 'work_order', 'wo-10', 'Completed work order: Sprinkler valve #3 stuck - valve freed and tested', '2026-03-19T14:00:00Z'),
  ('act-19', 'bld-2', 'usr-4', 'work_order_created', 'work_order', 'wo-12', 'Created work order: Grease trap cleaning overdue', '2026-03-20T10:30:00Z'),
  ('act-20', 'bld-2', 'usr-4', 'work_order_created', 'work_order', 'wo-5', 'Created work order: Elevator vibration complaint - Unit 8B', '2026-03-21T11:45:00Z'),
  ('act-21', 'bld-3', 'usr-4', 'inspection_started', 'inspection', 'ins-13', 'Started foundation inspection at Domaine du Parc', '2026-03-22T09:00:00Z'),
  ('act-22', 'bld-1', 'usr-3', 'work_order_created', 'work_order', 'wo-9', 'Created work order: Generator fuel level low', '2026-03-22T07:30:00Z'),
  ('act-23', 'bld-1', 'usr-2', 'work_order_created', 'work_order', 'wo-4', 'Created work order: Lobby carpet replacement', '2026-03-22T16:30:00Z'),
  ('act-24', 'bld-1', 'usr-2', 'work_order_created', 'work_order', 'wo-1', 'Created emergency work order: Water leak in unit 405 ceiling', '2026-03-23T08:15:00Z');

-- Inventory Categories
INSERT INTO inventory_categories (id, name, color) VALUES
  ('cat-tools', 'Power Tools', '#3b82f6'),
  ('cat-hand', 'Hand Tools', '#06b6d4'),
  ('cat-safety', 'Safety Equipment', '#ef4444'),
  ('cat-testing', 'Testing & Meters', '#f59e0b'),
  ('cat-access', 'Access Equipment', '#10b981'),
  ('cat-cleaning', 'Cleaning Equipment', '#8b5cf6'),
  ('cat-keys', 'Keys & Access Cards', '#64748b');

-- Inventory Items
INSERT INTO inventory_items (id, name, asset_tag, category, status, condition, unit_cost, last_location, checked_out_by, checked_out_date, notes) VALUES
  ('inv-1', 'DeWalt Hammer Drill DCD996', 'PT-001', 'cat-tools', 'checked_out', 'good', 329.00, 'bld-1', 'usr-3', '2026-03-22T08:30:00Z', '20V MAX XR, for concrete anchoring work in garage.'),
  ('inv-2', 'Milwaukee Reciprocating Saw', 'PT-002', 'cat-tools', 'available', 'good', 249.00, 'bld-1', NULL, NULL, 'M18 FUEL SAWZALL. Keep blade stock in tool room.'),
  ('inv-3', 'Makita Angle Grinder 4.5"', 'PT-003', 'cat-tools', 'checked_out', 'fair', 189.00, 'bld-3', 'usr-4', '2026-03-21T14:00:00Z', 'Needs new guard. Ordered replacement.'),
  ('inv-4', 'Bosch Rotary Laser Level', 'PT-004', 'cat-tools', 'available', 'good', 599.00, 'bld-2', NULL, NULL, 'Self-leveling, for alignment work.'),
  ('inv-5', 'DeWalt Portable Table Saw', 'PT-005', 'cat-tools', 'maintenance', 'needs_repair', 449.00, 'bld-1', NULL, NULL, 'Blade guard mechanism jammed. Sent for service Mar 18.'),
  ('inv-6', 'Ridgid Pipe Wrench Set (14"/18"/24")', 'HT-001', 'cat-hand', 'checked_out', 'good', 145.00, 'bld-2', 'usr-3', '2026-03-23T07:00:00Z', 'Heavy duty aluminum set.'),
  ('inv-7', 'Klein Electrician Tool Kit', 'HT-002', 'cat-hand', 'available', 'good', 210.00, 'bld-1', NULL, NULL, '11-piece insulated set, 1000V rated.'),
  ('inv-8', 'Knipex Pliers Set', 'HT-003', 'cat-hand', 'available', 'good', 175.00, 'bld-1', NULL, NULL, 'Cobra, Lineman, and Needle-nose.'),
  ('inv-9', 'Stanley Socket Set 200pc', 'HT-004', 'cat-hand', 'checked_out', 'good', 189.00, 'bld-1', 'usr-4', '2026-03-20T09:15:00Z', 'SAE and metric, 1/4" 3/8" 1/2" drive.'),
  ('inv-10', '3M Full-Face Respirator 6800', 'SE-001', 'cat-safety', 'available', 'good', 165.00, 'bld-1', NULL, NULL, 'Medium size. P100 cartridges in cabinet.'),
  ('inv-11', 'Miller Fall Protection Harness', 'SE-002', 'cat-safety', 'checked_out', 'good', 285.00, 'bld-1', 'usr-3', '2026-03-22T08:30:00Z', 'Annual inspection due Jun 2026.'),
  ('inv-12', 'Confined Space Gas Monitor', 'SE-003', 'cat-safety', 'available', 'good', 750.00, 'bld-1', NULL, NULL, '4-gas (O2/LEL/CO/H2S). Calibration due Apr 2026.'),
  ('inv-13', 'Miller Fall Protection Harness #2', 'SE-004', 'cat-safety', 'retired', 'needs_repair', 285.00, 'bld-1', NULL, NULL, 'RETIRED - Failed annual inspection. Webbing frayed. Replaced by SE-002.'),
  ('inv-14', 'Fluke 87V Digital Multimeter', 'TM-001', 'cat-testing', 'checked_out', 'good', 425.00, 'bld-2', 'usr-4', '2026-03-23T10:00:00Z', 'True RMS. For electrical panel inspection.'),
  ('inv-15', 'FLIR C5 Thermal Camera', 'TM-002', 'cat-testing', 'available', 'good', 699.00, 'bld-1', NULL, NULL, 'For detecting heat loss, water leaks, electrical hotspots.'),
  ('inv-16', 'Extech Moisture Meter', 'TM-003', 'cat-testing', 'available', 'good', 89.00, 'bld-3', NULL, NULL, 'Pin-type for drywall and concrete moisture.'),
  ('inv-17', 'Werner 28ft Extension Ladder', 'AE-001', 'cat-access', 'checked_out', 'good', 389.00, 'bld-3', 'usr-3', '2026-03-21T11:00:00Z', 'Fiberglass, 300lb capacity. For exterior facade work.'),
  ('inv-18', 'Little Giant Multi-Position Ladder', 'AE-002', 'cat-access', 'available', 'good', 299.00, 'bld-1', NULL, NULL, '22ft reach. For interior common area work.'),
  ('inv-19', 'Scaffold Tower 6ft Platform', 'AE-003', 'cat-access', 'maintenance', 'fair', 850.00, 'bld-2', NULL, NULL, 'Wheels need replacement. Parts on order.'),
  ('inv-20', 'Kärcher Pressure Washer K5', 'CE-001', 'cat-cleaning', 'available', 'good', 449.00, 'bld-1', NULL, NULL, '2000 PSI. For garage and exterior cleaning.'),
  ('inv-21', 'Tennant Floor Scrubber T300', 'CE-002', 'cat-cleaning', 'checked_out', 'good', 3200.00, 'bld-1', 'usr-3', '2026-03-24T06:30:00Z', 'Walk-behind, for garage spring cleaning.'),
  ('inv-22', 'Master Key Set - Résidence des Érables', 'KY-001', 'cat-keys', 'checked_out', 'good', 0, 'bld-1', 'usr-3', '2026-03-24T07:00:00Z', 'All common areas + mechanical rooms. Sign-out required.'),
  ('inv-23', 'Master Key Set - Le Château Saint-Laurent', 'KY-002', 'cat-keys', 'available', 'good', 0, 'bld-2', NULL, NULL, 'Stored in secure lockbox, office.'),
  ('inv-24', 'Elevator Machine Room Access Card', 'KY-003', 'cat-keys', 'checked_out', 'good', 0, 'bld-2', 'usr-4', '2026-03-23T10:00:00Z', 'Programmed for all 3 buildings. Return after shift.');

-- Checkout History
INSERT INTO checkout_history (id, item_id, action, user_id, date, notes) VALUES
  ('ch-1', 'inv-1', 'checkout', 'usr-3', '2026-03-22T08:30:00Z', 'For garage anchor bolt installation'),
  ('ch-2', 'inv-3', 'checkout', 'usr-4', '2026-03-21T14:00:00Z', 'Cutting rebar for balcony repair'),
  ('ch-3', 'inv-6', 'checkout', 'usr-3', '2026-03-23T07:00:00Z', 'Plumbing repair unit 302'),
  ('ch-4', 'inv-9', 'checkout', 'usr-4', '2026-03-20T09:15:00Z', 'Elevator mechanical room work'),
  ('ch-5', 'inv-11', 'checkout', 'usr-3', '2026-03-22T08:30:00Z', 'Roof anchor inspection'),
  ('ch-6', 'inv-14', 'checkout', 'usr-4', '2026-03-23T10:00:00Z', 'Panel voltage check, bld-2 main'),
  ('ch-7', 'inv-17', 'checkout', 'usr-3', '2026-03-21T11:00:00Z', 'Facade sealant inspection access'),
  ('ch-8', 'inv-21', 'checkout', 'usr-3', '2026-03-24T06:30:00Z', 'Garage spring deep clean'),
  ('ch-9', 'inv-22', 'checkout', 'usr-3', '2026-03-24T07:00:00Z', 'Morning shift'),
  ('ch-10', 'inv-24', 'checkout', 'usr-4', '2026-03-23T10:00:00Z', 'Elevator inspection'),
  ('ch-11', 'inv-15', 'checkin', 'usr-4', '2026-03-21T16:00:00Z', 'Done - found heat leak in unit 812 window'),
  ('ch-12', 'inv-2', 'checkin', 'usr-3', '2026-03-20T15:30:00Z', 'Pipe cut complete, returned to tool room'),
  ('ch-13', 'inv-7', 'checkin', 'usr-4', '2026-03-19T17:00:00Z', 'Panel rewiring done in bld-1 lobby'),
  ('ch-14', 'inv-20', 'checkin', 'usr-3', '2026-03-18T14:00:00Z', 'Garage entrance cleaned');
