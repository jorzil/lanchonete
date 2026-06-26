/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'static.openfoodfacts.org' },
      { protocol: 'https', hostname: 'cdn-cosmos.bluesoft.com.br' },
      { protocol: 'https', hostname: '**.vtexassets.com' },
      { protocol: 'https', hostname: '**.vteximg.com.br' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
}

export default nextConfig
