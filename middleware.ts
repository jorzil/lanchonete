import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  if (host === 'maissub.com.br') {
    const url = req.nextUrl.clone()
    url.host = 'www.maissub.com.br'
    return NextResponse.redirect(url, 301)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
