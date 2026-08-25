// Maps an author name to a profile link. Names not listed render as plain text.
export const authorLinks: Record<string, string> = {
  "BlancoByte": "https://www.linkedin.com/company/blancobyte",
};

export function authorLink(name: string): string | null {
  return authorLinks[name] ?? null;
}
