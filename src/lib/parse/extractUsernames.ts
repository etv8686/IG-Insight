// Extraction tolérante pour JSON Instagram (followers_1.json, following.json)
// Cherche string_list_data[].value partout, avec fallback sur relationships_following.
export function extractUsernames(json: unknown): string[] {
  const out: string[] = [];
  const push = (u?: string) => {
    if (u && typeof u === "string") out.push(u.trim().toLowerCase());
  };
  const walk = (x: unknown) => {
    if (!x) return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (typeof x === "object" && x !== null) {
      const obj = x as Record<string, unknown>;
      if (Array.isArray(obj.string_list_data)) {
        obj.string_list_data.forEach((d: unknown) => {
          if (typeof d === "object" && d !== null) {
            const item = d as Record<string, unknown>;
            push(item.value as string);
          }
        });
      }
      if (obj.relationships_following) {
        walk(obj.relationships_following);
      }
      Object.values(obj).forEach(walk);
    }
  };
  walk(json);
  return Array.from(new Set(out));
}
