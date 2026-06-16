import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
    short_name: 'Mais Sub',
    description: 'Delivery de subs artesanais em até 30 minutos. Ingredientes frescos, montados do seu jeito.',
    start_url: '/',
    display: 'standalone',
    background_color: '#011a33',
    theme_color: '#EE5C13',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
