import { useContentOverrides } from "@/hooks/use-content-overrides";
import type { ComponentProps } from "react";

/** Admin-selected source, preserving the original cover as fallback. */
export function ManagedImage({ imageKey, src, ...props }: ComponentProps<"img"> & { imageKey: string }) {
  const { get } = useContentOverrides();
  return <img {...props} src={get(imageKey)?.cover_url || src} />;
}