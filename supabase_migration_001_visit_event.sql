-- Migration: Add 'visit' to hive_events event_type check constraint
-- Run this in Supabase SQL Editor

ALTER TABLE hive_events DROP CONSTRAINT IF EXISTS hive_events_event_type_check;
ALTER TABLE hive_events ADD CONSTRAINT hive_events_event_type_check
  CHECK (event_type IN ('feed', 'treatment', 'box_added', 'inspection', 'move', 'cost', 'visit'));
