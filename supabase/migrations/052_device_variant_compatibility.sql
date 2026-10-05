BEGIN;

CREATE TABLE public.device_variant_compatibility (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.device_models(id) on delete cascade,
  parent_variant_type text not null,
  parent_value text not null,
  child_variant_type text not null,
  child_value text not null,
  created_at timestamptz not null default now(),
  CONSTRAINT uq_device_variant_compatibility UNIQUE (model_id, parent_variant_type, parent_value, child_variant_type, child_value),
  CONSTRAINT fk_parent_variant FOREIGN KEY (model_id, parent_variant_type, parent_value) REFERENCES public.device_model_variants (model_id, variant_type, value) ON DELETE CASCADE,
  CONSTRAINT fk_child_variant FOREIGN KEY (model_id, child_variant_type, child_value) REFERENCES public.device_model_variants (model_id, variant_type, value) ON DELETE CASCADE
);

ALTER TABLE public.device_variant_compatibility ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_device_variant_compatibility_model_id 
  ON public.device_variant_compatibility (model_id);

COMMIT;
