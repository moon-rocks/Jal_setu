CREATE OR REPLACE FUNCTION public.get_ward_by_coordinates(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS TABLE (ward_id UUID, ward_number VARCHAR, ward_name VARCHAR, city VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city
    FROM public.wards AS w
    WHERE lat BETWEEN -90 AND 90
      AND lon BETWEEN -180 AND 180
      AND w.boundary IS NOT NULL
      AND ST_SRID(w.boundary) = 4326
      AND ST_IsValid(w.boundary)
      AND ST_Covers(
        w.boundary,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)
      )
    ORDER BY ST_Area(w.boundary::geography), w.id
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_ward_centers()
RETURNS TABLE (
    id UUID,
    ward_number VARCHAR,
    ward_name VARCHAR,
    city VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city, ST_Y(w.centroid), ST_X(w.centroid)
    FROM public.wards AS w
    WHERE w.centroid IS NOT NULL
      AND w.boundary IS NOT NULL
      AND ST_SRID(w.boundary) = 4326
      AND ST_IsValid(w.boundary)
    ORDER BY w.city, w.ward_number;
$$;

REVOKE ALL ON FUNCTION public.get_ward_by_coordinates(DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ward_by_coordinates(DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_ward_centers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ward_centers() TO anon, authenticated;
