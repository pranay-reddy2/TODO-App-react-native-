import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for persistent auth
  users: defineTable({
    email: v.string(),
    // We store a hashed representation - in production use proper hashing
    // For this app we store the password as-is (demo purposes)
    password: v.string(),
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  todos: defineTable({
    title: v.string(),
    description: v.string(),
    dateTime: v.string(),
    deadline: v.string(),
    priority: v.string(),
    category: v.optional(v.string()), // NEW: task category/tag
    isCompleted: v.boolean(),
    userId: v.string(), // references users._id as string
  })
    .index("by_userId", ["userId"])
    .index("by_userId_category", ["userId", "category"]), // index for category filtering
});