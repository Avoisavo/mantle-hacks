import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createLightAccountAlchemyClient } from "@alchemy/aa-alchemy";

import { LocalAccountSigner } from "@alchemy/aa-core";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Here you can create a smart account using Alchemy AA SDK
      // The user's email will be used to create the account
      console.log("User signing in:", user);

      // Example: Create a light account (you'll need to implement this properly)
      // const alchemyClient = await createLightAccountAlchemyClient({
      //   apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      //   chain: mantle,
      //   signer: LocalAccountSigner,
      // });

      return true;
    },
    async session({ session, token }) {
      // Add smart account address to session
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
