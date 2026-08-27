import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No borrar el llamado a getUser().
  // Esto refresca la sesión si ha expirado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirecciones de seguridad centralizadas
  const isWebappRoute = request.nextUrl.pathname.startsWith('/empresa/webapp')
  const isLoginRoute = request.nextUrl.pathname === '/empresa/login'

  if (isWebappRoute && !user) {
    // Redirigir a login si no hay sesión
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/empresa/login'
    // Conservamos el parámetro de retorno para login seguro
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isLoginRoute && user) {
    // Redirigir al panel si ya está logueado
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/empresa/webapp'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
