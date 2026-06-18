// Covers functions that declare default parameter values.
function defaultPropFunc1(a: number, b: string | null = null): void {}

function defaultPropFunc2(a: number, b: string | null = null): void {}

defaultPropFunc1(3.14, 'Hello, world')

defaultPropFunc2(3.14)
