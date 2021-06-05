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
true ? 'Hey, Its trueee!' : 'Oh no.. Its false.';
// Got turnarys working. Just can't find a way to pop in the __coverExpression. :(

//true ? 'Ha' : 'Ho';

// Binary Expression

true || false

// Not working on && yet.