import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Register a new user — stores email + password in Convex DB.
 * Returns the user's _id as a string (used as userId for todos).
 */
export const registerUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new ConvexError("User already exists with this email.");
    }

    const id = await ctx.db.insert("users", {
      email,
      password: args.password, // In production: hash this password
      createdAt: new Date().toISOString(),
    });

    return { id: id.toString(), email };
  },
});

/**
 * Login — verifies credentials and returns the user record.
 */
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new ConvexError("User not found. Please register first.");
    }

    if (user.password !== args.password) {
      throw new ConvexError("Incorrect password.");
    }

    return { id: user._id.toString(), email: user.email };
  },
});

/**
 * Get user by email (for session restoration)
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;
    return { id: user._id.toString(), email: user.email };
  },
});