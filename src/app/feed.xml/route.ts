import { getAllPosts } from "@/lib/blog";
import { authorLink } from "@/lib/authors";

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = "https://blancobyte.com";

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${post.author}]]></dc:creator>${
        authorLink(post.author)
          ? `\n      <atom:link rel="author" href="${authorLink(post.author)}"/>`
          : ""
      }
      ${post.tags.map((t) => `<category>${t}</category>`).join("\n      ")}
    </item>`
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>BlancoByte Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Articles on databases, analytics, and running data privately, from BlancoByte.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(feed.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
