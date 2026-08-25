import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "BlancoByte documentation, guides for deploying and running private database and analytics systems.",
  alternates: { canonical: "https://blancobyte.com/docs" },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-container" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex h-full flex-col lg:flex-row">
        {children}
      </div>
    </div>
  );
}
