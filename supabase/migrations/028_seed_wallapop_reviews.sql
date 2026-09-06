-- ==========================================
-- 028_seed_wallapop_reviews.sql
-- ==========================================

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Carlota P.', 'Muy buena disposición, mucha seriedad y un trato perfecto. A!!! muy puntual', 'wallapop', 5, NULL, true, true, 10
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Carlota P.' AND review_text = 'Muy buena disposición, mucha seriedad y un trato perfecto. A!!! muy puntual'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Rikki N.', 'Impecable, chico rápido, amable y comprensivo con mis horarios... Muchas gracias', 'wallapop', 5, NULL, true, true, 20
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Rikki N.' AND review_text = 'Impecable, chico rápido, amable y comprensivo con mis horarios... Muchas gracias'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Rocio B.', 'Chico super amable, puntual y rápido. Muy recomendable', 'wallapop', 5, NULL, true, true, 30
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Rocio B.' AND review_text = 'Chico super amable, puntual y rápido. Muy recomendable'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Daniel G.', 'Rápido y serio. Me he quedado bastante contento con el trato', 'wallapop', 5, NULL, true, true, 40
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Daniel G.' AND review_text = 'Rápido y serio. Me he quedado bastante contento con el trato'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Adrián O.', 'Muy serio y amable. Lo recomiendo 100%.', 'wallapop', 5, NULL, false, true, 50
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Adrián O.' AND review_text = 'Muy serio y amable. Lo recomiendo 100%.'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Fran H.', 'Muy recomendado, super serio desde el primer momento', 'wallapop', 5, NULL, false, true, 60
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Fran H.' AND review_text = 'Muy recomendado, super serio desde el primer momento'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Elisa B.', 'Excelente persona, 100% recomendable. Todo perfecto.', 'wallapop', 5, NULL, false, true, 70
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Elisa B.' AND review_text = 'Excelente persona, 100% recomendable. Todo perfecto.'
);

INSERT INTO public.reviews (author_name, review_text, source, rating, review_date, featured, active, sort_order)
SELECT 'Alberto M.', 'Puntual y buena comunicacion con Kevin', 'wallapop', 5, NULL, false, true, 80
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews WHERE author_name = 'Alberto M.' AND review_text = 'Puntual y buena comunicacion con Kevin'
);
