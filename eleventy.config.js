// eleventy.config.js (ESM, no CJS plugin nonsense)
import markdownIt from "markdown-it";
import readingTime from "reading-time";

export default async function (eleventyConfig) {
  // ----- Filename-based permalinks
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: data => {
      const src = data.page?.inputPath || "";
      const parts = src.split(/[\\/]+/);
      const file = parts.pop() || "";
      const parent = parts.pop() || "";
      const baseNoExt = file.replace(/\.[^.]+$/, "");
      const slugify = s =>
        String(s).toLowerCase().normalize("NFKD")
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

  // ----- Reading-time filter (ESM-friendly)
  const WPM = 220;
  eleventyConfig.addFilter("rt", input => {
    const src =
      (input && typeof input === "object" && (input.templateContent || input.content)) ||
      String(input ?? "");
    const stats = readingTime(src, { wordsPerMinute: WPM });
    const minutes = Math.max(1, Math.ceil(stats.minutes));
    return `${minutes} min read`;
    // if you insist on "minutes", change the string
  });

  // ----- Passthroughs
  eleventyConfig.addPassthroughCopy({ "input/image": "image" });
  eleventyConfig.addPassthroughCopy({ "input/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "input/css": "css" });
  eleventyConfig.addPassthroughCopy({ "input/js": "js" });
  eleventyConfig.addPassthroughCopy({ "input/favicon.ico": "favicon.ico" });

  // ----- Nunjucks
  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: false,
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
  });

  // ----- Markdown-it
  const md = markdownIt({ html: true, breaks: true, linkify: true });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPairedShortcode("md", content => md.render(content));
  eleventyConfig.addFilter("md", str => md.render(str ?? ""));

  // ----- HTML minify
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
    dir: { input: "input", output: "output", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
}
