BEGIN;

-- 1. DROP EXISTING UNIQUE CONSTRAINT ON (category, name)
-- In migration 001_core_inventory.sql: UNIQUE(category, name)
-- PostgreSQL defaults table constraints named as: <table>_<column1>_<column2>_key
ALTER TABLE public.device_models 
DROP CONSTRAINT IF EXISTS device_models_category_name_key;

-- 2. ADD UNIQUE CONSTRAINT ON (category, brand, name)
-- Ensures that models across different brands in category 'other' (or any category)
-- can share the same model name without collision.
ALTER TABLE public.device_models 
ADD CONSTRAINT device_models_category_brand_name_key 
UNIQUE (category, brand, name);

COMMIT;
