// Blocks
{
  // @ts-ignore
  trace("Block1 Executed!");
}

{
  // @ts-ignore
  trace("Block2 Executed!");
}

// If Statements

if (true) {
  // @ts-ignore
  trace("If1 Executed!");
}

if (false) {
  // @ts-ignore
  trace("If2 Executed!");
}

// Functions

export function test1(): void {
  // @ts-ignore
  trace("Function1 Executed!");
}

export function test2(): void {
  // @ts-ignore
  trace("Function2 Executed!");
}

// Turnary

// @ts-ignore
trace(true ? "Hey, Its trueee!" : "Oh no.. Its false.");

// Binary Expression

// @ts-ignore
true || false;

true && true;
