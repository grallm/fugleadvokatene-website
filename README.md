# FugleAdvokatene Website

New website for the [FugleAdvokatene](https://www.fugleadvokatene.no/) bird protection and rehabilitation organisation based in Norway.

## Description

Static site created with [Astro](https://astro.build/). The goal is to have a SEO friendly webfront with basic information on the organisation and on what should be done with birds needing help.

### Blog

The website will also have a blog where posts can be added.

We use [Keystatic](https://keystatic.com/) for this.

### Store

A basic store is a nice to have.

We will probably use [Snipcart](https://docs.astro.build/en/guides/ecommerce/#snipcart) to allow easy sells without too much of a backend.

## Setup

1. Install dependencies `pnpm i`

2. Start the app `pnpm dev`

### Comments

As Keystatic doesn't baseURL in Astro, when the env var `KEYSTATIC=1` is set, there are no baseURL and Keystatic works
