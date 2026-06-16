import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mais Sub — O Sub Mais Gostoso Da Cidade',
    short_name: 'Mais Sub',
    description: 'Delivery de subs artesanais em até 30 minutos. Ingredientes frescos, montados do seu jeito.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EE',
    theme_color: '#0E1F3C',
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
