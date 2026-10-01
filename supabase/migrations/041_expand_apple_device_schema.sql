BEGIN;

ALTER TABLE public.device_models 
DROP CONSTRAINT IF EXISTS device_models_category_check;

ALTER TABLE public.device_model_variants 
DROP CONSTRAINT IF EXISTS device_model_variants_variant_type_check;

ALTER TABLE public.device_models 
ADD CONSTRAINT device_models_category_check 
CHECK (category IN (
    'iphone', 
    'apple_watch', 
    'airpods', 
    'macbook', 
    'ipad', 
    'ps5', 
    'nintendo_switch'
));

ALTER TABLE public.device_model_variants 
ADD CONSTRAINT device_model_variants_variant_type_check 
CHECK (variant_type IN (
    'storage', 
    'color', 
    'size', 
    'connectivity', 
    'chip', 
    'memory', 
    'case_type', 
    'case_material'
));

ALTER TABLE public.devices
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS connectivity text,
ADD COLUMN IF NOT EXISTS chip text,
ADD COLUMN IF NOT EXISTS memory text,
ADD COLUMN IF NOT EXISTS case_type text,
ADD COLUMN IF NOT EXISTS case_material text;

COMMIT;
