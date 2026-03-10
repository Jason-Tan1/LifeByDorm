import { useEffect } from 'react';

interface SEOConfig {
    title: string;
    description?: string;
    canonicalPath?: string; // e.g. "/universities/york-university"
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = 'LifeByDorm';
const BASE_URL = 'https://www.lifebydorm.ca';
const DEFAULT_TITLE = 'LifeByDorm | Real Student Photos & Dorm Reviews for Canadian Schools';
const DEFAULT_DESCRIPTION =
    'Read real, unbiased dorm reviews and see authentic photos from students at Canadian universities. Find the best college residences before you move in on LifeByDorm.';

/**
 * Custom hook to manage per-page SEO metadata.
 * Sets document title, meta description, canonical link, and JSON-LD structured data.
 * Cleans up and restores defaults on unmount.
 */
export function useSEO({ title, description, canonicalPath, jsonLd }: SEOConfig) {
    useEffect(() => {
        // --- Title ---
        const prevTitle = document.title;
        document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

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

        // --- Canonical Link ---
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        const prevCanonical = canonicalLink?.getAttribute('href') || '';
        if (canonicalPath) {
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.setAttribute('href', `${BASE_URL}${canonicalPath}`);
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

            if (canonicalLink && canonicalPath) {
                if (prevCanonical) {
                    canonicalLink.setAttribute('href', prevCanonical);
                } else {
                    canonicalLink.remove();
                }
            }

            if (jsonLdScript) {
                jsonLdScript.remove();
            }
        };
    }, [title, description, canonicalPath, jsonLd]);
}
