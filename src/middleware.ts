import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "easy_games_admin";

function getAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const secret = process.env.ADMIN_SECRET || "easy-games";
  return Buffer.from(password + ":" + secret).toString("base64");
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Proteção da área admin (cookie)
  if (path.startsWith("/admin")) {
    if (path === "/admin/login") return NextResponse.next();
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token !== getAdminToken()) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // Sessão Supabase Auth: atualizar cookies e proteger /carrinho e /checkout
  const response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (path === "/carrinho" || path.startsWith("/checkout")) {
        if (!user) {
          const login = new URL("/login", request.url);
          login.searchParams.set("redirect", path);
          return NextResponse.redirect(login);
        }
      }
    } catch {
      // Se Supabase falhar (env errado, rede, etc.), deixa a requisição seguir
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
