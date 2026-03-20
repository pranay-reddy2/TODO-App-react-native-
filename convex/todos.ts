import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Priority order mapping for smart sort algorithm
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/**
 * Fetch todos for a specific user, sorted by:
 * 1. Incomplete first, completed last
 * 2. Among incomplete: high priority → medium → low
 * 3. Within same priority: nearest deadline first (no deadline goes last)
 * 4. Secondary tiebreaker: most recently created first
 */
export const getTodos = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let todos = await ctx.db.query("todos").order("desc").collect();

    // Filter by userId if provided so each user only sees their own tasks
    if (args.userId) {
      todos = todos.filter((t) => t.userId === args.userId);
    }

    // Smart sort: incomplete first, then by priority + deadline mix
    todos.sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      // Among incomplete tasks: sort by priority
      const priorityDiff =
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
      if (priorityDiff !== 0) return priorityDiff;

      // Same priority: sort by deadline (nearest first, no deadline last)
      if (a.deadline && b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;

      // Final tiebreaker: newer first (already ordered desc by _creationTime)
      return 0;
    });

    return todos;
  },
});

export const addTodo = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    dateTime: v.string(),
    deadline: v.string(),
    priority: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate priority value
    const validPriorities = ["low", "medium", "high"];
    const priority = validPriorities.includes(args.priority) ? args.priority : "medium";

    return await ctx.db.insert("todos", {
      title: args.title.trim(),
      description: args.description.trim(),
      dateTime: args.dateTime,
      deadline: args.deadline,
      priority,
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
  },
});

export const updateTodo = mutation({
  args: {
    id: v.id("todos"),
    title: v.string(),
    description: v.string(),
    deadline: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    if (!todo) throw new ConvexError("Todo not found");

    await ctx.db.patch(args.id, {
      title: args.title.trim(),
      description: args.description.trim(),
      deadline: args.deadline,
      priority: args.priority,
    });
  },
});

export const clearAllTodos = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let todos = await ctx.db.query("todos").collect();

    // Only clear the current user's todos if userId provided
    if (args.userId) {
      todos = todos.filter((t) => t.userId === args.userId);
    }

    for (const todo of todos) {
      await ctx.db.delete(todo._id);
    }

    return { deletedCount: todos.length };
  },
});