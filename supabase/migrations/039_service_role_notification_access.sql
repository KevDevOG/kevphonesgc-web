BEGIN;

GRANT SELECT ON TABLE public.sale_requests TO service_role;
GRANT SELECT ON TABLE public.device_models TO service_role;

COMMIT;
