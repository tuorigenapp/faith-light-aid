ALTER FUNCTION public.award_gems(integer,text,jsonb) SECURITY INVOKER;
ALTER FUNCTION public.create_hoja_transfer(text,integer) SECURITY INVOKER;
ALTER FUNCTION public.has_role(uuid,public.app_role) SECURITY INVOKER;