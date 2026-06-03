import { useQuery } from "@tanstack/react-query";
import { getPageContent, type ContentMap } from "@/lib/page-content";

export type ContentHelpers = {
  loading: boolean;
  map: ContentMap;
  text: (section: string, field: string, fallback?: string) => string;
  num: (section: string, field: string, fallback?: number | null) => number | null;
  has: (section: string, field: string) => boolean;
};

export function usePageContent(pageKey: string): ContentHelpers {
  const { data, isLoading } = useQuery({
    queryKey: ["page-content", pageKey],
    queryFn: () => getPageContent(pageKey),
    staleTime: 30_000,
  });

  const map = (data ?? {}) as ContentMap;
  return {
    loading: isLoading,
    map,
    text: (section, field, fallback = "") => {
      const v = map[section]?.[field]?.text;
      return v && v.trim().length > 0 ? v : fallback;
    },
    num: (section, field, fallback = null) => {
      const v = map[section]?.[field]?.number;
      return v !== null && v !== undefined ? v : fallback ?? null;
    },
    has: (section, field) => {
      const v = map[section]?.[field];
      return !!(v && ((v.text && v.text.trim().length > 0) || v.number !== null));
    },
  };
}
