import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Priority order mapping for smart sort algorithm
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * Fetch todos for a specific user (by userId string = user._id),
 * with optional category filter, sorted by:
 * 1. Incomplete first, completed last
 * 2. Among incomplete: high priority → medium → low
 * 3. Within same priority: nearest deadline first (no deadline goes last)
 * 4. Secondary tiebreaker: most recently created first
 */
export const getTodos = query({
  args: {
    userId: v.optional(v.string()),
    category: v.optional(v.string()), // NEW: optional category filter
  },
  handler: async (ctx, args) => {
    let todos = await ctx.db.query("todos").order("desc").collect();

    // Filter by userId if provided
    if (args.userId) {
      todos = todos.filter((t) => t.userId === args.userId);
    }

    // Filter by category if provided (and not "all")
    if (args.category && args.category !== "all") {
      todos = todos.filter((t) => (t.category ?? "General") === args.category);
    }

    // Smart sort: completion → priority → deadline → creation time
    todos.sort((a, b) => {
      // 1. Incomplete tasks first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      // 2. Sort by priority (high → medium → low)
      const priorityDiff =
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
      if (priorityDiff !== 0) return priorityDiff;

      // 3. Sort by deadline (nearest first, no deadline goes last)
      if (a.deadline && b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;

      // 4. Most recently created first (already ordered desc above)
      return 0;
    });

    return todos;
  },
});

/**
 * Get all unique categories for a user
 */
export const getUserCategories = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const todos = await ctx.db.query("todos").collect();
    const userTodos = todos.filter((t) => t.userId === args.userId);
    const categories = new Set(userTodos.map((t) => t.category ?? "General"));
    return Array.from(categories).sort();
  },
});

export const addTodo = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    dateTime: v.string(),
    deadline: v.string(),
    priority: v.string(),
    category: v.optional(v.string()), // NEW
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const validPriorities = ["low", "medium", "high"];
    const priority = validPriorities.includes(args.priority)
      ? args.priority
      : "medium";

    return await ctx.db.insert("todos", {
      title: args.title.trim(),
      description: args.description.trim(),
      dateTime: args.dateTime,
      deadline: args.deadline,
      priority,
      category: args.category?.trim() || "General",
      isCompleted: false,
      userId: args.userId,
    });
  },
});

export const toggleTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");

    await ctx.db.patch(args.id, {
      isCompleted: !todo.isCompleted,
    });
  },
});

export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    title: v.string(),
    description: v.string(),
    dateTime: v.optional(v.string()), // NEW: allow updating dateTime
    deadline: v.string(),
    priority: v.string(),
    category: v.optional(v.string()), // NEW
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      description: args.description.trim(),
      ...(args.dateTime ? { dateTime: args.dateTime } : {}),
      deadline: args.deadline,
      priority: args.priority,
      category: args.category?.trim() || todo.category || "General",
    });
  },
});

/**
 * Clear all todos for a given userId — fixed to properly filter and delete.
 */
export const clearAllTodos = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let todos = await ctx.db.query("todos").collect();

    // Only clear the current user's todos if userId provided
    if (args.userId) {
      todos = todos.filter((t) => t.userId === args.userId);
    }

    // Delete each one
    const deletePromises = todos.map((todo) => ctx.db.delete(todo._id));
    await Promise.all(deletePromises);

    return { deletedCount: todos.length };
  },
});