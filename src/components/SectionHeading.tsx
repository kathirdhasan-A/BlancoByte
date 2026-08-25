export function SectionHeading({
  tag,
  title,
  description,
  center = true,
  as: Tag = "h2",
}: {
  tag?: string;
  title: string;
  description?: string;
  center?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {tag && (
        <p className="mb-3 font-mono text-sm font-medium uppercase tracking-wider text-accent">{tag}</p>
      )}
      <Tag className="font-display text-3xl text-text-primary md:text-4xl">{title}</Tag>
      {description && <p className="mt-4 text-base leading-relaxed text-text-muted">{description}</p>}
    </div>
  );
}
