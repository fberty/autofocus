import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth');
      const isApiML = nextUrl.pathname.startsWith('/api/mercadolibre');

      if (isApiAuth || isApiML) return true;
      if (isOnLogin) return !isLoggedIn || Response.redirect(new URL('/', nextUrl));
      return isLoggedIn || Response.redirect(new URL('/login', nextUrl));
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts (not edge-compatible)
};
