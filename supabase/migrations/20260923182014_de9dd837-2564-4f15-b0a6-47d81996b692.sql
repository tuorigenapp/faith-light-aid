REVOKE UPDATE ON public.community_notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.community_notifications TO authenticated;