import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import Stripe from "stripe";
import { stripe } from "@better-auth/stripe";

// If you are working on local development, comment out any of the auth methods that are not needed for local development.

// Required in all envs
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

// Optional providers (enabled only if fully configured). In production we will log
// if missing, but do not crash to allow password auth.
const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasGithub = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
// const hasTwitter = !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);

const hasStripe = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_WEBHOOK_SECRET &&
  process.env.STRIPE_PRO_PRICE_ID
);

const stripeClient = hasStripe
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    })
  : undefined;

// Build social providers only for configured providers
const socialProviders: any = {};
if (hasGoogle) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (hasGithub) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}
// if (hasTwitter) { /* add twitter provider here if needed */ }

// Conditionally include Stripe plugin
const plugins: any[] = [];
if (hasStripe && stripeClient) {
  plugins.push(
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      onEvent: async (event: Stripe.Event): Promise<void> => {
        console.log(`[Stripe] Event received: ${event.type}`);
      },
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: process.env.STRIPE_PRO_PRICE_ID!,
            limits: { workspaces: 5 },
          },
        ],
      },
    })
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true, // This will automatically map tables to their plural form (e.g., user -> users)
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  plugins,
}); 
