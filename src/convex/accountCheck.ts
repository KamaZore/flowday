import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public check used by the register form: does any account already use this
 * email? Convex Auth's signUp flow does not reject duplicate emails, so the
 * UI checks first and shows "already exists — sign in instead".
 */
export const exists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.trim().toLowerCase();
    if (!normalized) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalized))
      .first();
    return user !== null;
  },
});
