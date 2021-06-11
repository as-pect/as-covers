// Normal Functions
function test1(): void {}

function test2(): void {}

test1();

test2();

// Arrow functions
const test3 = (): void => {};

const test4 = (): void => {};

test3();

test4();

// Turnarys

true ? "Its true" : "Its false";

false ? "Its true" : "Its false";

// Binary

true || false;

true && true;

false && false;

// If Statements

if (true) {
}

if (false) "";

// Parameters

function testParameter(a: string, b: string | null = null): void {}

testParameter("Hello World");

testParameter("Hello World", "Hola!");

// Switch Case

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

// Block Statement

{
}

{
}

// Class

class ExampleClass {
    constructor() {}
    exampleFunction(): void {}
}

new ExampleClass().exampleFunction()