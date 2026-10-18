import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const image = z
  .string()
  .regex(/^\/images\/[a-zA-Z0-9/_\-.]+$/)
  .default("/images/photos/flying-pigeon.webp");
const common = {
  title: z.string(),
  description: z.string(),
  draft: z.boolean().default(true),
  image,
};
const postSchema = z.object({ ...common, date: z.coerce.date() });
const pageSchema = z.object(common);
const volunteerSchema = z.object({
  ...common,
  city: z.string().default(""),
  role: z.string().default("Frivillig"),
  order: z.number().default(0),
});
const productSchema = z.object({
  ...common,
  price: z.number().nonnegative(),
  checkoutUrl: z
    .string()
    .refine((value) => {
      if (value === "") return true;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }, "Use an HTTPS checkout URL")
    .default(""),
  available: z.boolean().default(false),
});
const posts = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/posts" }),
  schema: postSchema,
});
const pages = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages" }),
  schema: pageSchema,
});
const volunteers = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/volunteers" }),
  schema: volunteerSchema,
});
const products = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/products" }),
  schema: productSchema,
});
const postsEn = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/posts/en" }),
  schema: postSchema,
});
const pagesEn = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/pages/en" }),
  schema: pageSchema,
});
const volunteersEn = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/volunteers/en" }),
  schema: volunteerSchema,
});
const productsEn = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/products/en" }),
  schema: productSchema,
});
export const collections = {
  posts,
  pages,
  volunteers,
  products,
  postsEn,
  pagesEn,
  volunteersEn,
  productsEn,
};
