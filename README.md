# as-covers

This package transforms your software, adding some assemblyscript calls to the host to report code coverage.

# if statements

Any if statements will have the following lines injected into your source code:

```ts
__coverReportConditional(fileName, line, col, 0);
__coverReportConditional(fileName, line2, col2, 1);

if (condition) {
  __coverConditional(0);
  // one branch
} else {
  __coverConditional(1);
 // another branch
}
```

# functions

```ts
__coverReportFunction(fileName, "a", line, col, 0);
__coverReportFunction(fileName, "b", line2, col2, 1);

function a(): void {
  __coverFunction(0);
}

function b(): void {
  __coverFunction(1);
}
```

# ternary expressions

```ts
__coverReportConditional(fileName, line, col, 0);
__coverReportConditional(fileName, line2, col2, 1);

let val = condition
  ? __coverConditional(0, truthyValue)
  : __coverConditional(1, falsyValue);
```

# Boolean Expressions

```ts
// untouched version
if (a && b) {
  // something
}

// turns into
__coverReportConditional(fileName, line, col, 0);
if (a && __coverConditional(0, b)) {
  // something
}
```
