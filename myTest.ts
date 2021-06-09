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

// @ts-ignore
if (false) trace("If3 Executed!");

if (true) {
}
// @ts-ignore
else trace("If4 Executed!");
// Functions

export function test1(): void {
  // @ts-ignore
  trace("Function1 Executed!");
}

export function test2(): void {
  // @ts-ignore
  trace("Function2 Executed!");
}

export const test3 = (): number => 42;

class a {
  haha(): void {
    // @ts-ignore
    trace("Haha!");
  }
}

switch (true) {
  case true: {
    break;
  }
  // @ts-ignore
  case false: {
    break;
  }
  default: {
    break;
  }
}

const aa = new a();

aa.haha();

class randomClass {
  constructor() {}
  get randomness (): string {
    return 'lolz'
  }
  set bunnys (a: string) {
  }
}

// Turnary

// @ts-ignore
trace(true ? "Hey, Its trueee!" : "Oh no.. Its false.");

// Binary Expression

false || false;

false && true;

// Defalt parm

function randoFunc(a: number, b: string | null = null): void {
  a
  b
}

randoFunc(3.14)