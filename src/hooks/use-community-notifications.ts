import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommunityNotification = {
  id: string;
  post_id: string;
  bucket: "feed" | "mine" | "comments" | "following";
  created_at: string;
};

export function useCommunityNotifications(userId?: string) {
  return useQuery({
    queryKey: ["community-notifications", userId],
    enabled: !!userId,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase.from("community_notifications")
        .select("id,post_id,bucket,created_at")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as CommunityNotification[];
    },
  });
}

export function useMarkCommunityRead(userId?: string) {
  const queryClient = useQueryClient();
  return async (postId: string) => {
    if (!userId) return;
    const { error } = await supabase.from("community_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("post_id", postId)
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["community-notifications", userId] });
  };
}