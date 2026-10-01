BEGIN;

-- Deactivate pre-2020 iPhone models
UPDATE public.device_models
SET active = false
WHERE category = 'iphone'
  AND name IN (
    'iPhone 11',
    'iPhone 11 Pro',
    'iPhone 11 Pro Max'
  );

-- Deactivate pre-2020 Nintendo Switch models
UPDATE public.device_models
SET active = false
WHERE category = 'nintendo_switch'
  AND name IN (
    'Nintendo Switch',
    'Nintendo Switch Lite'
  );

COMMIT;
