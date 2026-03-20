import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    title: v.string(),
    description: v.string(),
    dateTime: v.string(),
    deadline: v.string(),
    priority: v.string(), 
    isCompleted: v.boolean(),
    userId: v.string(),
  }),
});