/*
Things we need to cover:
1. Blocks
2. If statements (w/block)
3. If statements (w/o/block)
4. Functions (Arrow)
5. Functions (Normal)
6. Single-line functions
7. && statements
8. || statements
9. Switch/case
10. Default Propertys
Add more as soon as I can think of them.
*/

// Blocks

// Execute this one
{}

// If statement (w/block)

// Execute this one
if (true) {}

if (false) {}

// If statement (w/o/block)

// Execute this one
if (true) ''

if (false) ''

// Functions (arrow)

// Execute this one
const arrowFunc1 = (): void => {}

const arrowFunc2 = (): void => {}

arrowFunc1()

// Functions (normal)

// Execute this one
function normalFunc1(): void {}

function normalFunc2(): void {}

normalFunc1()

// Single-Line functions

// Execute this one
const singleLineFunc1 = (): string => 'Hello World!'

const singleLineFunc2 = (): string => ''

singleLineFunc1()

// && Statements

// Execute this one
true && true

true && false

// || Statements

// Execute this one
true || false

false || false

// Switch/case
switch (true) {
    // Execute this one
    case true: ''
    // @ts-ignore
    case false: ''
    default: ''
}

// Default properties

// Execute this one
function defaultPropFunc1(a: number, b: string | null = null): void {}

function defaultPropFunc2(a: number, b: string | null = null): void {}

defaultPropFunc1(3.14, 'Hello, world')

defaultPropFunc2(3.14)
