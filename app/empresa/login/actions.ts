"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit } from '@/utils/rate-limit'

export async function login(formData: FormData) {
  // Limitar a 5 intentos de login por minuto por IP
  const isAllowed = await checkRateLimit('login', 5, 60000);
  if (!isAllowed) {
    return redirect('/empresa/login?error=' + encodeURIComponent('Demasiados intentos. Por favor, intenta de nuevo en un minuto.'));
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect('/empresa/login?error=' + encodeURIComponent(error.message))
  }

  redirect('/empresa/webapp')
}

export async function signup(formData: FormData) {
  // Limitar a 3 registros por hora por IP
  const isAllowed = await checkRateLimit('signup', 3, 3600000);
  if (!isAllowed) {
    return redirect('/empresa/register?error=' + encodeURIComponent('Demasiados intentos de registro. Intenta más tarde.'));
  }

  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp({
    ...data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/empresa/login?success=Cuenta confirmada. Ya puedes iniciar sesión.`,
    },
  })

  if (error) {
    return redirect('/empresa/register?error=' + encodeURIComponent(error.message))
  }

  // Redirigir a la página de aviso de confirmación de email
  redirect('/empresa/register/verify')
}

export async function resetPassword(formData: FormData) {
  // Limitar a 3 intentos de recuperación por hora por IP
  const isAllowed = await checkRateLimit('resetPassword', 3, 3600000);
  if (!isAllowed) {
    return redirect('/empresa/forgot-password?error=' + encodeURIComponent('Demasiados intentos. Revisa tu correo o intenta más tarde.'));
  }

  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/empresa/update-password`,
  })

  if (error) {
    return redirect('/empresa/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/empresa/forgot-password?success=Revisa tu correo electrónico')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return redirect('/empresa/update-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/empresa/login?success=Contraseña actualizada correctamente')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/empresa/login')
}
