-- Fix security warnings by updating function search paths
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_project_id()
RETURNS UUID AS $$
  SELECT project_id FROM public.client_project_access WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;;
