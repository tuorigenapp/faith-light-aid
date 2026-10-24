import { useState, type ComponentProps } from "react";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { useContentOverrides } from "@/hooks/use-content-overrides";
import { consultaCoverPath } from "@/lib/consulta-cover";
import treeCover from "@/assets/consultas/consulta-arbol.jpg";
import genericCover from "@/assets/consultas/consulta-patrones.jpg";

/** List, detail and panel use the same managed source, signing and reliable fallback. */
export function ConsultaCover({ slug, imageKey, src, ...props }: ComponentProps<"img"> & { slug?: string; imageKey?: string }) {
  const { get } = useContentOverrides();
  const isTree = slug?.startsWith("sana-tu-arbol-familiar") ?? false;
  const key = imageKey ?? (isTree ? "imagen:consulta:banner-arbol" : slug ? `consulta:${slug}` : "");
  const source = (key && get(key)?.cover_url) || src;
  const path = consultaCoverPath(source);
  // Bundled asset paths do not belong to Storage.
  const privatePath = path && !path.startsWith("/") && !/^https?:\/\//i.test(path) ? path : undefined;
  const signed = useSignedUrls("content-covers", [privatePath]);
  const resolved = privatePath ? signed(privatePath) : path;
  const fallback = isTree ? treeCover : genericCover;
  const [failedSource, setFailedSource] = useState<string>();
  return <img {...props} src={resolved && resolved !== failedSource ? resolved : fallback} onError={event => { if (resolved) setFailedSource(resolved); props.onError?.(event); }} />;
}