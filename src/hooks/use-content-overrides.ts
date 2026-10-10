import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCamino, customToCamino, type Camino } from "@/lib/caminos";

export type ContentOverride = {
  key: string;
  scope: string;
  title: string | null;
  cover_url: string | null;
  is_hidden: boolean;
};

/** Portadas, títulos y visibilidad que la administración ajusta desde el panel. */
export function useContentOverrides() {
  const q = useQuery({
    queryKey: ["content-overrides"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("content_overrides")
        .select("key, scope, title, cover_url, is_hidden");
      return (data ?? []) as ContentOverride[];
    },
  });
  const map = new Map((q.data ?? []).map((o) => [o.key, o]));
  return { map, get: (key: string) => map.get(key), isLoading: q.isLoading };
}

export type CustomCamino = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  content: import("@/lib/caminos").CustomCaminoContent & {
    stages?: {
      title: string;
      lessons: {
        title: string;
        lesson: string;
        affirmation: string;
        tasks: string[];
        search_words: string[];
        quiz: { question: string; options: string[]; correctIndex: number }[];
      }[];
    }[];
  };
};

export function useCustomCaminos() {
  return useQuery({
    queryKey: ["custom-caminos"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_caminos")
        .select("id, slug, title, subtitle, cover_url, content")
        .eq("is_published", true)
        .order("sort_order");
      return (data ?? []) as unknown as CustomCamino[];
    },
  });
}

/** Busca un camino por id: primero los fijos, luego los creados en el panel. */
export function useCamino(id: string) {
  const fixed = getCamino(id);
  const custom = useCustomCaminos();
  if (fixed) return { camino: fixed as Camino, isLoading: false };
  const row = custom.data?.find((c) => c.slug === id);
  return { camino: row ? customToCamino(row) : null, isLoading: custom.isLoading };
}
