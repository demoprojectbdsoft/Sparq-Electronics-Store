import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db(process.env.DATABASE as string);

// The store API owns the SMTP mailbox, so the reset email is sent there.
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL, 
  database: mongodbAdapter(db, {
    client,
  }),
  plugins: [jwt()],
  emailAndPassword: {
    enabled: true,
    // Must match "one hour" in the email: passwordResetEmail() on the server.
    resetPasswordTokenExpiresIn: 60 * 60,
    // A reset signs the account out everywhere, so a session stolen before the
    // reset cannot be used after it.
    revokeSessionsOnPasswordReset: true,
    /**
     * Called by better-auth with a link that already carries the token. The
     * email itself is sent by the API, which owns the mailbox, the template
     * and the store branding.
     */
    sendResetPassword: async ({ user, url }) => {
      if (!API_URL || !INTERNAL_API_KEY) {
        throw new Error(
          "Password reset is not configured: set NEXT_PUBLIC_API_URL and INTERNAL_API_KEY."
        );
      }

      const res = await fetch(`${API_URL}/mail/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_API_KEY,
        },
        body: JSON.stringify({ email: user.email, name: user.name, url }),
      });

      // The API reports the mail server's own reason, such as a rejected login.
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || `The reset email could not be sent (status ${res.status}).`
        );
      }
    },
  },
  socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "customer",
      },
      plan: {
        type: "string",
        input: false,
        defaultValue: "free",
      },
      status: {
        type: "string",
        input: false,
        defaultValue: "active",
      },
      member: {
        type: "string",
        input: false,
        defaultValue: "silver",
      },
      points: {
        type: "number",
        input: false,
        defaultValue: 0,
      },
      phone: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      department: {
        type: "string",
        required: false,
      },
    },
  },
});