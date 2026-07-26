import { useQuery } from "@tanstack/react-query";
import { signPaths } from "@/lib/photo";

/** Resuelve rutas privadas de storage a URLs firmadas utilizables en <img>. */
export function useSignedUrls(bucket: string, paths: (string | null | undefined)[]) {
  const clean = Array.from(new Set(paths.filter(Boolean) as string[])).sort();
  const { data } = useQuery({
    queryKey: ["signed", bucket, clean.join("|")],
    enabled: clean.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: () => signPaths(bucket, clean),
  });
  return (p?: string | null) => (p ? (p.startsWith("http") ? p : data?.[p]) : undefined);
}
