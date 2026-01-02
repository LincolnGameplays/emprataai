/**
 * SEO Engine - Programmatic SEO with Structured Data
 * 
 * Automatically generates Rich Snippets (JSON-LD) for Google.
 * Makes restaurants and products appear with ratings, prices, and images in search results.
 */

import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description: string;
  image?: string;
  path: string;
  type?: 'website' | 'restaurant' | 'product';
  priceRange?: string; // ex: $$
  rating?: number | null;
  reviewCount?: number;
  // Restaurant specific
  cuisineType?: string;
  address?: string;
  phone?: string;
  // Product specific
  price?: number;
  availability?: 'InStock' | 'OutOfStock';
}

export function SeoEngine({ 
  title, 
  description, 
  image, 
  path, 
  type = 'website', 
  priceRange,
  rating,
  reviewCount,
  cuisineType,
  address,
  phone,
  price,
  availability = 'InStock'
}: SeoProps) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://emprata.ai';
  const fullUrl = `${siteUrl}${path}`;
  const defaultImage = `${siteUrl}/og-image.jpg`;
  const safeImage = image || defaultImage;

  // JSON-LD Structured Data for Google Rich Snippets
  const getStructuredData = () => {
    if (type === 'restaurant') {
      return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": title,
        "image": safeImage,
        "url": fullUrl,
        "priceRange": priceRange || "$$",
        "servesCuisine": cuisineType || "Delivery",
        "address": address ? {
          "@type": "PostalAddress",
          "streetAddress": address
        } : undefined,
        "telephone": phone,
        "aggregateRating": rating ? {
          "@type": "AggregateRating",
          "ratingValue": rating.toFixed(1),
          "bestRating": "5",
          "worstRating": "1",
          "reviewCount": reviewCount || 1
        } : undefined,
        "potentialAction": {
          "@type": "OrderAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": fullUrl,
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          },
          "deliveryMethod": ["http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"]
        }
      };
    }

    if (type === 'product') {
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title,
        "description": description,
        "image": safeImage,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "BRL",
          "price": price?.toFixed(2) || "0.00",
          "availability": `https://schema.org/${availability}`,
          "url": fullUrl
        },
        "aggregateRating": rating ? {
          "@type": "AggregateRating",
          "ratingValue": rating.toFixed(1),
          "reviewCount": reviewCount || 1
        } : undefined
      };
    }

    // Default: Website
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "EmprataAI - Delivery Inteligente",
      "url": siteUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  };

  const structuredData = getStructuredData();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title} | EmprataAI</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph (WhatsApp/Facebook/LinkedIn) */}
      <meta property="og:type" content={type === 'restaurant' ? 'restaurant.restaurant' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={safeImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="EmprataAI" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={safeImage} />

      {/* Mobile */}
      <meta name="theme-color" content="#FF6B00" />
      <meta name="apple-mobile-web-app-capable" content="yes" />

      {/* Rich Snippets - JSON-LD (The SEO Secret) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

/**
 * Hook to generate SEO metadata for a menu item
 */
export function useProductSeo(item: {
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  slug: string;
}) {
  return {
    title: item.title,
    description: item.description || `Peça ${item.title} agora no EmprataAI`,
    image: item.imageUrl,
    path: `/menu/${item.slug}`,
    type: 'product' as const,
    price: item.price,
    availability: 'InStock' as const
  };
}
