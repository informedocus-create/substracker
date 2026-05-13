import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const { supabase } = await import("@/lib/supabase");
      
      const { error } = await supabase.from("users").upsert({
        email: user.email,
        name: user.name,
        avatar: user.image,
      }, { onConflict: 'email' });

      if (error) {
        console.error("Error syncing user to Supabase:", error);
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("email", session.user.email)
        .single();
      
      if (data) {
        session.user.id = data.id;
      }
      
      return session;
    },
  },
};
