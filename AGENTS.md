# AGENTS.md

## Project Philosophy

`as-covers` exists to make code coverage for AssemblyScript projects feel simple, fast, and dependable.

When working in this repository, prefer changes that support these goals:

1. **Make coverage for AssemblyScript projects simple.** Keep APIs, transform behavior, CLI/test flows, reports, fixtures, and documentation easy to understand. Optimize for the shortest path from compiling instrumented code to getting useful coverage feedback.
2. **Reduce dependencies as much as possible.** Avoid adding packages unless they clearly pay for their complexity. Prefer small, local implementations and standard platform features when practical.
3. **Make coverage for AssemblyScript projects fast.** Protect startup time, transform time, execution time, and developer feedback loops. Treat unnecessary work, heavy abstractions, and avoidable I/O as costs to justify.

Favor maintainable, focused changes that preserve compatibility for existing `as-covers` users while making the coverage experience simpler, leaner, and faster.

## Commit Philosophy

Make commits atomic and easy to review. Separate distinct units of work into separate commits, each with a clear title and a descriptive commit message that explains the intent, context, and user-visible impact of the change.
