-- ==========================================
-- 027_reviews.sql
-- ==========================================

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  review_text text NOT NULL,
  source text NOT NULL,
  rating smallint NULL,
  review_date date NULL,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reviews_author_name_check CHECK (trim(author_name) <> '' AND length(author_name) <= 100),
  CONSTRAINT reviews_review_text_check CHECK (trim(review_text) <> '' AND length(review_text) <= 1000),
  CONSTRAINT reviews_source_check CHECK (source IN ('wallapop', 'whatsapp', 'other')),
  CONSTRAINT reviews_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT reviews_sort_order_check CHECK (sort_order >= 0)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Explicit least privilege grants
REVOKE ALL PRIVILEGES ON TABLE public.reviews FROM anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;

-- Policies

-- Public/anon can only SELECT active reviews
CREATE POLICY "Public can view active reviews"
  ON public.reviews
  FOR SELECT
  TO anon
  USING (active = true);

-- Authenticated (admin only) can SELECT all
CREATE POLICY "Admin can view all reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Authenticated (admin only) can INSERT
CREATE POLICY "Admin can insert reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Authenticated (admin only) can UPDATE
CREATE POLICY "Admin can update reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd')
  WITH CHECK (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Authenticated (admin only) can DELETE
CREATE POLICY "Admin can delete reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = '76320352-4c29-42ad-a105-345e0b5928dd');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Revoke public execution only on this specific function
REVOKE ALL ON FUNCTION public.update_reviews_updated_at() FROM PUBLIC;

CREATE TRIGGER update_reviews_timestamp
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();
