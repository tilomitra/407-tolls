import { interchanges } from "@/data";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const slugToId = new Map<string, string>();
const idToSlug = new Map<string, string>();

for (const ic of interchanges) {
  const slug = slugify(ic.name);
  slugToId.set(slug, ic.id);
  idToSlug.set(ic.id, slug);
}

export function resolveSlugRoute(route: string): { entryId: string; exitId: string } | null {
  const match = route.match(/^(.+)-to-(.+)$/);
  if (!match) return null;

  const entrySlug = match[1]!;
  const exitSlug = match[2]!;

  const entryId = slugToId.get(entrySlug);
  const exitId = slugToId.get(exitSlug);
  if (!entryId || !exitId) return null;

  return { entryId, exitId };
}

export function buildSlugRoute(entryId: string, exitId: string): string {
  const entrySlug = idToSlug.get(entryId);
  const exitSlug = idToSlug.get(exitId);
  if (!entrySlug || !exitSlug) return `${entryId}-to-${exitId}`;
  return `${entrySlug}-to-${exitSlug}`;
}
