-- Reusable function to set updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. DEVICE MODELS
CREATE TABLE device_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('iphone', 'ps5', 'nintendo_switch')),
  brand text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  supports_battery_health boolean NOT NULL DEFAULT false,
  supports_cycles boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, name)
);

CREATE TRIGGER set_device_models_updated_at
  BEFORE UPDATE ON device_models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;


-- 2. DEVICE MODEL VARIANTS
CREATE TABLE device_model_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
  variant_type text NOT NULL CHECK (variant_type IN ('storage', 'color')),
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(model_id, variant_type, value)
);

CREATE INDEX idx_device_model_variants_model_id ON device_model_variants(model_id);

ALTER TABLE device_model_variants ENABLE ROW LEVEL SECURITY;


-- 3. CLIENTS
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;


-- 4. DEVICES
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES device_models(id),
  seller_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  storage text,
  color text,
  imei_serial text UNIQUE NOT NULL,
  battery_health integer CHECK (battery_health >= 0 AND battery_health <= 100),
  battery_cycles integer CHECK (battery_cycles >= 0),
  condition text NOT NULL CHECK (condition IN ('sealed', 'like_new', 'good', 'marked')),
  has_box boolean NOT NULL DEFAULT false,
  has_cable boolean NOT NULL DEFAULT false,
  has_invoice boolean NOT NULL DEFAULT false,
  warranty_until date,
  original_parts boolean NOT NULL DEFAULT true,
  fully_functional boolean NOT NULL DEFAULT true,
  purchase_price numeric(10,2) NOT NULL CHECK (purchase_price >= 0),
  listing_price numeric(10,2) NOT NULL CHECK (listing_price >= 0),
  purchase_location text,
  purchased_at date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_model_id ON devices(model_id);
CREATE INDEX idx_devices_seller_client_id ON devices(seller_client_id);

CREATE TRIGGER set_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;


-- 5. DEVICE IMAGES
CREATE TABLE device_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_images_device_id ON device_images(device_id);

ALTER TABLE device_images ENABLE ROW LEVEL SECURITY;
