// Extraction tolérante pour JSON Instagram (followers_1.json, following.json)
// Cherche string_list_data[].value partout, avec fallback sur relationships_following.
export function extractUsernames(json: unknown): string[] {
  const out: string[] = [];
  const push = (u?: string) => {
    if (u && typeof u === "string") out.push(u.trim().toLowerCase());
  };
  const walk = (x: any) => {
    if (!x) return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (typeof x === "object") {
      if (Array.isArray((x as any).string_list_data)) {
        (x as any).string_list_data.forEach((d: any) => push(d?.value));
      }
      if ((x as any).relationships_following) {
        walk((x as any).relationships_following);
      }
      Object.values(x).forEach(walk);
    }
  };
  walk(json);
  return Array.from(new Set(out));
}
