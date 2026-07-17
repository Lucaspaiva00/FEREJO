/**
 * Social Media Public Data Scraper
 *
 * Fetches publicly available metadata from social media profile URLs using
 * Open Graph tags, JSON-LD structured data, and HTML parsing.
 *
 * Limitations:
 * - Instagram/Facebook/LinkedIn require OAuth for follower counts.
 * - This module extracts only what is publicly visible without authentication:
 *   profile name, bio, avatar image, and any counts exposed in HTML.
 */

import * as cheerio from "cheerio";

export interface SocialProfile {
  platform: string;
  handle: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followers: number | null;
  rating: number | null;
  reviewCount: number | null;
  extraLabel: string | null;
  extraValue: string | null;
  fetchedAt: number;
  note: string | null;
}

const FETCH_TIMEOUT_MS = 8000;

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractOgMeta(
  $: ReturnType<typeof cheerio.load>
): Record<string, string> {
  const og: Record<string, string> = {};
  $("meta[property^='og:'], meta[name^='og:']").each((_, el) => {
    const prop =
      $(el).attr("property") ?? $(el).attr("name") ?? "";
    const content = $(el).attr("content") ?? "";
    if (prop && content) og[prop.replace("og:", "")] = content;
  });
  // Also grab twitter card tags as fallback
  $("meta[name^='twitter:']").each((_, el) => {
    const name = $(el).attr("name") ?? "";
    const content = $(el).attr("content") ?? "";
    const key = name.replace("twitter:", "");
    if (key && content && !og[key]) og[key] = content;
  });
  return og;
}

function parseNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  // Handle formats like "1.2M", "12K", "1.234", "1,234"
  const clean = text.trim().replace(/\s/g, "");
  const m = clean.match(/^([\d,.]+)\s*([KkMmBb]?)$/);
  if (!m) return null;
  const base = parseFloat(m[1].replace(",", ".").replace(/\./g, (c, i, s) => {
    // Keep only the last dot as decimal separator
    return i === s.lastIndexOf(".") ? "." : "";
  }));
  if (isNaN(base)) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase()] ?? 1;
  return Math.round(base * mult);
}

function extractHandle(url: string, platform: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (platform === "instagram" || platform === "facebook") {
      return parts[0] ? `@${parts[0]}` : null;
    }
    if (platform === "linkedin") {
      // /company/name or /in/name
      return parts.length >= 2 ? parts[1] : parts[0] ?? null;
    }
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Platform-specific scrapers ──────────────────────────────────────────────

async function scrapeInstagram(url: string): Promise<SocialProfile> {
  const handle = extractHandle(url, "instagram");
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let followers: number | null = null;
  let note: string | null =
    "Seguidores requerem autenticação via Instagram API. Exibindo dados do perfil público.";

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);

    name = og["title"] ?? $("title").text().split("•")[0].trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;

    // Instagram sometimes embeds follower count in the description meta tag
    // e.g. "1.2M Followers, 450 Following, 892 Posts"
    const desc = og["description"] ?? "";
    const followerMatch = desc.match(/([\d,.]+[KkMm]?)\s*[Ff]ollowers?/i);
    if (followerMatch) {
      followers = parseNumber(followerMatch[1]);
      if (followers) note = null;
    }
  } catch (e: any) {
    note = `Não foi possível acessar o perfil: ${e.message}`;
  }

  return {
    platform: "instagram",
    handle,
    name,
    bio,
    avatarUrl,
    followers,
    rating: null,
    reviewCount: null,
    extraLabel: null,
    extraValue: null,
    fetchedAt: Date.now(),
    note,
  };
}

async function scrapeFacebook(url: string): Promise<SocialProfile> {
  const handle = extractHandle(url, "facebook");
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let followers: number | null = null;
  let note: string | null =
    "Curtidas/seguidores requerem Facebook Graph API. Exibindo dados do perfil público.";

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);

    name = og["title"] ?? $("title").text().split("|")[0].trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;

    // Some Facebook pages expose like counts in description
    const desc = og["description"] ?? "";
    const likeMatch = desc.match(/([\d,.]+[KkMm]?)\s*(?:curtidas|likes?)/i);
    if (likeMatch) {
      followers = parseNumber(likeMatch[1]);
      if (followers) note = null;
    }
  } catch (e: any) {
    note = `Não foi possível acessar a página: ${e.message}`;
  }

  return {
    platform: "facebook",
    handle,
    name,
    bio,
    avatarUrl,
    followers,
    rating: null,
    reviewCount: null,
    extraLabel: null,
    extraValue: null,
    fetchedAt: Date.now(),
    note,
  };
}

async function scrapeLinkedIn(url: string): Promise<SocialProfile> {
  const handle = extractHandle(url, "linkedin");
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let followers: number | null = null;
  let note: string | null =
    "Seguidores requerem LinkedIn API. Exibindo dados da página pública.";

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);

    name = og["title"] ?? $("title").text().split("|")[0].trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;

    // LinkedIn sometimes includes follower count in description
    const desc = og["description"] ?? "";
    const followerMatch = desc.match(/([\d,.]+[KkMm]?)\s*(?:seguidores|followers?)/i);
    if (followerMatch) {
      followers = parseNumber(followerMatch[1]);
      if (followers) note = null;
    }
  } catch (e: any) {
    note = `Não foi possível acessar a página: ${e.message}`;
  }

  return {
    platform: "linkedin",
    handle,
    name,
    bio,
    avatarUrl,
    followers,
    rating: null,
    reviewCount: null,
    extraLabel: null,
    extraValue: null,
    fetchedAt: Date.now(),
    note,
  };
}

async function scrapeGoogleBusiness(url: string): Promise<SocialProfile> {
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let note: string | null = null;

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);

    name = og["title"] ?? $("title").text().split("-")[0].trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;

    // Try to find rating in JSON-LD
    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "{}");
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item.aggregateRating) {
            rating = parseFloat(item.aggregateRating.ratingValue) || null;
            reviewCount = parseInt(item.aggregateRating.reviewCount) || null;
          }
        }
      } catch {
        // ignore
      }
    });

    if (!rating) {
      // Fallback: look for rating pattern in text
      const text = $("body").text();
      const ratingMatch = text.match(/(\d[.,]\d)\s*(?:estrelas?|stars?|\([\d,]+\s*avaliações?\))/i);
      if (ratingMatch) rating = parseFloat(ratingMatch[1].replace(",", "."));
    }
  } catch (e: any) {
    note = `Não foi possível acessar a página: ${e.message}`;
  }

  return {
    platform: "google",
    handle: null,
    name,
    bio,
    avatarUrl,
    followers: null,
    rating,
    reviewCount,
    extraLabel: reviewCount ? "Avaliações" : null,
    extraValue: reviewCount ? String(reviewCount) : null,
    fetchedAt: Date.now(),
    note,
  };
}

async function scrapeAppStore(url: string): Promise<SocialProfile> {
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let note: string | null = null;

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);

    name = og["title"] ?? $("title").text().split("-")[0].trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;

    // JSON-LD for app stores
    $("script[type='application/ld+json']").each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "{}");
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item.aggregateRating) {
            rating = parseFloat(item.aggregateRating.ratingValue) || null;
            reviewCount = parseInt(item.aggregateRating.reviewCount) || null;
          }
        }
      } catch {
        // ignore
      }
    });
  } catch (e: any) {
    note = `Não foi possível acessar a página: ${e.message}`;
  }

  return {
    platform: "app",
    handle: null,
    name,
    bio,
    avatarUrl,
    followers: null,
    rating,
    reviewCount,
    extraLabel: reviewCount ? "Avaliações" : null,
    extraValue: reviewCount ? String(reviewCount) : null,
    fetchedAt: Date.now(),
    note,
  };
}

async function scrapeGeneric(
  url: string,
  platform: string
): Promise<SocialProfile> {
  let name: string | null = null;
  let bio: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const og = extractOgMeta($);
    name = og["title"] ?? $("title").text().trim() ?? null;
    bio = og["description"] ?? null;
    avatarUrl = og["image"] ?? null;
  } catch {
    // ignore
  }

  return {
    platform,
    handle: null,
    name,
    bio,
    avatarUrl,
    followers: null,
    rating: null,
    reviewCount: null,
    extraLabel: null,
    extraValue: null,
    fetchedAt: Date.now(),
    note: "Dados detalhados requerem integração via API.",
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function fetchSocialProfile(
  platform: string,
  url: string
): Promise<SocialProfile> {
  switch (platform) {
    case "instagram":
      return scrapeInstagram(url);
    case "facebook":
      return scrapeFacebook(url);
    case "linkedin":
      return scrapeLinkedIn(url);
    case "google":
      return scrapeGoogleBusiness(url);
    case "app":
      return scrapeAppStore(url);
    default:
      return scrapeGeneric(url, platform);
  }
}
