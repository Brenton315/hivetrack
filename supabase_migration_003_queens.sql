-- Phase 4: Queen rearing pipeline
-- Creates the queens table and indexes for the queen rearing module

-- Queen stage enum
CREATE TYPE queen_stage AS ENUM (
  'graft',
  'cell_builder',
  'capped',
  'mating_nuc',
  'laying',
  'introduced',
  'sold',
  'failed'
);

-- Queens table
CREATE TABLE IF NOT EXISTS queens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  org_id      UUID REFERENCES organizations(id),
  code        TEXT NOT NULL,
  line        TEXT NOT NULL DEFAULT 'Unknown',
  mother_id   UUID REFERENCES queens(id),
  graft_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  stage       queen_stage NOT NULL DEFAULT 'graft',
  stage_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  hive_id     UUID REFERENCES hives(id),
  site_id     UUID REFERENCES sites(id),
  notes       TEXT,
  cost        NUMERIC(10,2) NOT NULL DEFAULT 0,
  sold_price  NUMERIC(10,2),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_queens_user ON queens(user_id);
CREATE INDEX idx_queens_org ON queens(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_queens_stage ON queens(stage);
CREATE INDEX idx_queens_mother ON queens(mother_id) WHERE mother_id IS NOT NULL;
CREATE INDEX idx_queens_line ON queens(line);

-- RLS
ALTER TABLE queens ENABLE ROW LEVEL SECURITY;

CREATE POLICY queens_select ON queens FOR SELECT USING (
  user_id = auth.uid()
  OR org_id IN (SELECT user_org_ids())
);

CREATE POLICY queens_insert ON queens FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY queens_update ON queens FOR UPDATE USING (
  user_id = auth.uid()
  OR (org_id IN (SELECT user_org_ids())
      AND user_has_role(org_id, 'head_beekeeper'))
);

CREATE POLICY queens_delete ON queens FOR DELETE USING (
  user_id = auth.uid()
  OR (org_id IN (SELECT user_org_ids())
      AND user_has_role(org_id, 'owner'))
);
