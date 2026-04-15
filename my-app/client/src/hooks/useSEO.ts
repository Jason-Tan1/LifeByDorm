import { useEffect } from 'react';

interface SEOConfig {
    title: string;
    description?: string;
    canonicalPath?: string; // e.g. "/universities/york-university"
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
    ogImage?: string;       // Per-page image for og:image + twitter:image
    noIndex?: boolean;      // true → noindex, nofollow (for non-content pages)
}

const SITE_NAME = 'LifeByDorm';
const BASE_URL = 'https://www.lifebydorm.ca';
const DEFAULT_TITLE = 'LifeByDorm | Real Student Photos & Dorm Reviews for Canadian Schools';
const DEFAULT_DESCRIPTION =
    'Read real, unbiased dorm reviews and see authentic photos from students at Canadian universities. Find the best university residences before you move in on LifeByDorm.';
const DEFAULT_OG_IMAGE = 'https://www.lifebydorm.ca/LifeByDormShortLogoSquare.png';

/**
 * Custom hook to manage per-page SEO metadata.
 * Sets document title, meta description, canonical link, OG/Twitter tags,
 * hreflang alternates, noindex control, and JSON-LD structured data.
 * Cleans up and restores defaults on unmount.
 */
export function useSEO({ title, description, canonicalPath, jsonLd, ogImage, noIndex }: SEOConfig) {
    useEffect(() => {
        const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
        const fullUrl = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;
        const imageUrl = ogImage || DEFAULT_OG_IMAGE;

        // --- Title ---
        const prevTitle = document.title;
        document.title = fullTitle;

        // --- Meta Description ---
        let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        const prevDescription = metaDesc?.getAttribute('content') || '';
        if (description) {
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', description);
        }

        // --- Robots (noIndex) ---
        let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        const prevRobots = robotsMeta?.getAttribute('content') || '';
        if (noIndex) {
            if (!robotsMeta) {
                robotsMeta = document.createElement('meta');
                robotsMeta.setAttribute('name', 'robots');
                document.head.appendChild(robotsMeta);
            }
            robotsMeta.setAttribute('content', 'noindex, nofollow');
        }

        // --- Canonical Link ---
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        const prevCanonical = canonicalLink?.getAttribute('href') || '';
        if (canonicalPath) {
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.setAttribute('href', fullUrl);
        }

        // --- OG Tags ---
        const setOgTag = (property: string, content: string) => {
            let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
            const prev = tag?.getAttribute('content') || '';
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
            return prev;
        };

        const prevOgTitle = setOgTag('og:title', fullTitle);
        const prevOgDesc = description ? setOgTag('og:description', description) : '';
        const prevOgUrl = canonicalPath ? setOgTag('og:url', fullUrl) : '';
        const prevOgImage = ogImage ? setOgTag('og:image', imageUrl) : '';

        // --- Twitter Tags ---
        const setTwitterTag = (name: string, content: string) => {
            let tag = document.querySelector(`meta[property="twitter:${name}"], meta[name="twitter:${name}"]`) as HTMLMetaElement | null;
            const prev = tag?.getAttribute('content') || '';
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', `twitter:${name}`);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
            return prev;
        };

        const prevTwTitle = setTwitterTag('title', fullTitle);
        const prevTwDesc = description ? setTwitterTag('description', description) : '';
        const prevTwUrl = canonicalPath ? setTwitterTag('url', fullUrl) : '';
        const prevTwImage = ogImage ? setTwitterTag('image', imageUrl) : '';

        // --- Hreflang Alternates ---
        const hreflangTags: HTMLLinkElement[] = [];
        if (canonicalPath) {
            const langs: Array<{ hreflang: string; href: string }> = [
                { hreflang: 'en', href: fullUrl },
                { hreflang: 'fr', href: fullUrl },
                { hreflang: 'x-default', href: fullUrl },
            ];
            langs.forEach(({ hreflang, href }) => {
                const link = document.createElement('link');
                link.setAttribute('rel', 'alternate');
                link.setAttribute('hreflang', hreflang);
                link.setAttribute('href', href);
                link.setAttribute('data-seo-hreflang', 'true');
                document.head.appendChild(link);
                hreflangTags.push(link);
            });
        }

        // --- JSON-LD ---
        let jsonLdScript: HTMLScriptElement | null = null;
        if (jsonLd) {
            jsonLdScript = document.createElement('script');
            jsonLdScript.setAttribute('type', 'application/ld+json');
            jsonLdScript.setAttribute('data-seo-hook', 'true');
            jsonLdScript.textContent = JSON.stringify(jsonLd);
            document.head.appendChild(jsonLdScript);
        }

        // --- Cleanup on unmount ---
        return () => {
            document.title = prevTitle || DEFAULT_TITLE;

            if (metaDesc && description) {
                metaDesc.setAttribute('content', prevDescription || DEFAULT_DESCRIPTION);
            }

            if (robotsMeta && noIndex) {
                if (prevRobots) {
                    robotsMeta.setAttribute('content', prevRobots);
                } else {
                    robotsMeta.setAttribute('content', 'index, follow');
                }
            }

            if (canonicalLink && canonicalPath) {
                if (prevCanonical) {
                    canonicalLink.setAttribute('href', prevCanonical);
                } else {
                    canonicalLink.remove();
                }
            }

            // Restore OG tags
            const restoreOg = (property: string, prev: string) => {
                const tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
                if (tag) {
                    if (prev) tag.setAttribute('content', prev);
                }
            };
            if (prevOgTitle) restoreOg('og:title', prevOgTitle);
            if (prevOgDesc) restoreOg('og:description', prevOgDesc);
            if (prevOgUrl) restoreOg('og:url', prevOgUrl);
            if (prevOgImage) restoreOg('og:image', prevOgImage);

            // Restore Twitter tags
            const restoreTw = (name: string, prev: string) => {
                const tag = document.querySelector(`meta[property="twitter:${name}"], meta[name="twitter:${name}"]`) as HTMLMetaElement | null;
                if (tag && prev) tag.setAttribute('content', prev);
            };
            if (prevTwTitle) restoreTw('title', prevTwTitle);
            if (prevTwDesc) restoreTw('description', prevTwDesc);
            if (prevTwUrl) restoreTw('url', prevTwUrl);
            if (prevTwImage) restoreTw('image', prevTwImage);

            // Remove hreflang tags
            hreflangTags.forEach(tag => tag.remove());

            if (jsonLdScript) {
                jsonLdScript.remove();
            }
        };
    }, [title, description, canonicalPath, jsonLd, ogImage, noIndex]);
}
