-- Function to create a case by explicitly specifying all columns
CREATE OR REPLACE FUNCTION create_case(
  p_name TEXT, 
  p_description TEXT, 
  p_status TEXT, 
  p_user_id UUID,
  p_is_archived BOOLEAN DEFAULT FALSE
) RETURNS SETOF cases AS $$
DECLARE
  v_case_id UUID;
BEGIN
  -- Insert the case
  INSERT INTO public.cases (
    name,
    description,
    status,
    created_by,
    owner_id,
    is_archived,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_description,
    p_status,
    p_user_id,
    p_user_id,
    p_is_archived,
    NOW(),
    NOW()
  ) RETURNING id INTO v_case_id;
  
  -- Return the created case
  RETURN QUERY SELECT * FROM public.cases WHERE id = v_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
