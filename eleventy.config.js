// eleventy.config.js (ESM)
import { fileURLToPath } from "url";
import path from "path";
import markdownIt from "markdown-it";
import pluginReadingTime from "eleventy-plugin-reading-time";
import readingTime from "reading-time"; // ← universal filter backend

export default async function (eleventyConfig) {
  // ----- Global: filename-based permalinks; root index stays index.html
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: data => {
      const src = data.page?.inputPath || "";
      const parts = src.split(/[\\/]+/);
      const file = parts.pop() || "";
      const parent = parts.pop() || "";
      const baseNoExt = file.replace(/\.[^.]+$/, "");
      const slugify = s =>
        String(s)
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "page";
      if (baseNoExt.toLowerCase() === "index" && (parent === "input" || parent === "")) {
        return "index.html";
      }
      if (baseNoExt.toLowerCase() === "index") {
        return `${slugify(parent)}.html`;
      }
      return `${slugify(baseNoExt)}.html`;
    }
  });

  // ----- Plugin: Reading Time (kept)
  eleventyConfig.addPlugin(pluginReadingTime);

  // ----- Universal Reading-Time filter ("rt")
  // Usage in Nunjucks:
  //   {{ content | rt }}            → "3 min read"
  //   {{ post | rt }}               → works on collection items
  // Adjust WPM here if you must.
  const WPM = 220;
  eleventyConfig.addFilter("rt", input => {
    const src =
      (input && typeof input === "object" && (input.templateContent || input.content)) ||
      String(input ?? "");
    const stats = readingTime(src, { wordsPerMinute: WPM });
    const minutes = Math.max(1, Math.ceil(stats.minutes));
    return `${minutes} minutes`;
  });

  // ----- Passthroughs
  eleventyConfig.addPassthroughCopy({ "input/image": "image" });
  eleventyConfig.addPassthroughCopy({ "input/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "input/css": "css" });
  eleventyConfig.addPassthroughCopy({ "input/js": "js" });
  eleventyConfig.addPassthroughCopy({ "input/favicon.ico": "favicon.ico" });

  // ----- Nunjucks behavior
  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: false,
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
  });

  // ----- Markdown-it
  const md = markdownIt({ html: true, breaks: true, linkify: true });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPairedShortcode("md", (content) => md.render(content));
  eleventyConfig.addFilter("md", (str) => md.render(str ?? ""));

  // ----- HTML minify transform
  const { minify } = await import("html-minifier-terser");
  eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      return await minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        useShortDoctype: true,
        keepClosingSlash: true
      });
    }
    return content;
  });

  return {
    dir: {
      input: "input",
      output: "docs",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
