-- ==========================================
-- 029_business_settings_wallapop.sql
-- ==========================================

ALTER TABLE public.business_settings
ADD COLUMN wallapop_url text NULL;

UPDATE public.business_settings
SET wallapop_url = 'https://www.wallapop.com/user/kevino-50711449'
WHERE singleton = true;
