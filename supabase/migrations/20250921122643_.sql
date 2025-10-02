-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'ADMIN'::app_role);

-- Add RLS policy for admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (get_current_user_role() = 'ADMIN'::app_role);;
