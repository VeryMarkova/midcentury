// eleventy.config.js (ESM, clean, gh-pages aware)
import markdownIt from "markdown-it";
import readingTime from "reading-time";

const REPO = "very-markova-11ty-theme"; // change if you ever rename the repo
const isProd = process.env.ELEVENTY_ENV === "production";
const PATH_PREFIX = isProd ? `/${REPO}/` : "/";

export default async function (eleventyConfig) {
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: data => {
      const src = data.page?.inputPath || "";
      const parts = src.split(/[\\/]+/);
      const file = parts.pop() || "";
      const parent = parts.pop() || "";
      const baseNoExt = file.replace(/\.[^.]+$/, "");
      const slugify = s => String(s).toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "page";
      if (baseNoExt.toLowerCase() === "index" && (parent === "input" || parent === "")) return "index.html";
      if (baseNoExt.toLowerCase() === "index") return `${slugify(parent)}.html`;
      return `${slugify(baseNoExt)}.html`;
    }
  });

  eleventyConfig.addGlobalData("site", { pathPrefix: PATH_PREFIX });

  const WPM = 220;

  eleventyConfig.addFilter("rt", input => {
    const src = (input && typeof input === "object" && (input.templateContent || input.content)) || String(input ?? "");
    const minutes = Math.max(1, Math.ceil(readingTime(src, { wordsPerMinute: WPM }).minutes));
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  });

  eleventyConfig.addPassthroughCopy({ "input/image": "image" });
  eleventyConfig.addPassthroughCopy({ "input/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "input/css": "css" });
  eleventyConfig.addPassthroughCopy({ "input/js": "js" });
  eleventyConfig.addPassthroughCopy({ "input/favicon.ico": "favicon.ico" });

  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: false,
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
  });

  const md = markdownIt({ html: true, breaks: true, linkify: true });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addPairedShortcode("md", content => md.render(content));
  eleventyConfig.addFilter("md", str => md.render(str ?? ""));
  eleventyConfig.addShortcode("formatDate", dateObj =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(dateObj)
  );

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
    templateFormats: ["njk", "md", "html"],
    pathPrefix: PATH_PREFIX
  };
}
