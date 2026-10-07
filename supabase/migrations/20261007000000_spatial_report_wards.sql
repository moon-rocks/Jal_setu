CREATE OR REPLACE FUNCTION public.get_ward_by_coordinates(lat DOUBLE PRECISION, lon DOUBLE PRECISION)
RETURNS TABLE (ward_id UUID, ward_number VARCHAR, ward_name VARCHAR, city VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT w.id, w.ward_number, w.ward_name, w.city
    FROM public.wards AS w
    WHERE w.boundary IS NOT NULL
      AND ST_Covers(
        w.boundary,
        ST_SetSRID(ST_MakePoint(lon, lat), 4326)
      )
    ORDER BY w.id
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.sync_report_spatial_ward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);

    SELECT match.ward_id, match.ward_name, match.city
    INTO NEW.ward_id, NEW.ward_name, NEW.city
    FROM public.get_ward_by_coordinates(NEW.latitude, NEW.longitude) AS match
    LIMIT 1;

    IF NOT FOUND THEN
        NEW.ward_id = NULL;
        NEW.ward_name = NULL;
        NEW.city = NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_report_spatial_ward_trigger ON public.reports;
CREATE TRIGGER sync_report_spatial_ward_trigger
    BEFORE INSERT OR UPDATE OF latitude, longitude, ward_id, ward_name, city
    ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.sync_report_spatial_ward();
