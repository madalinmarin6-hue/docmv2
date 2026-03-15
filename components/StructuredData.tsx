export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "DocM",
    "url": "https://docm.app",
    "description": "Edit, convert and manage PDF, Word, Excel, PowerPoint and 10+ formats online. No installation needed.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "9.99",
      "priceCurrency": "USD",
      "offerCount": "2",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "USD"
        },
        {
          "@type": "Offer",
          "name": "Premium Plan",
          "price": "9.99",
          "priceCurrency": "USD"
        }
      ]
    },
    "featureList": [
      "PDF Editor",
      "PDF Creator",
      "Word Editor",
      "Excel Editor",
      "PowerPoint Editor",
      "File Conversion",
      "File Compression",
      "Background Removal",
      "PDF Splitting"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2847",
      "bestRating": "5"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
