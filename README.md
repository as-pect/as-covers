# as-covers

This package transforms your software, adding some assemblyscript calls to the host to report code coverage.

# if statements

Any if statements will have the following lines injected into your source code:

```ts
__coverReportBlock(fileName, line, col, 0);
__coverReportBlock(fileName, line2, col2, 1);

if (condition) {
  __coverBlock(0);
  // one branch
} else {
  __coverBlock(1);
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
__coverReportExpression(fileName, line, col, 0);
__coverReportExpression(fileName, line2, col2, 1);

let val = condition
  ? __coverExpression(truthyValue, 0)
  : __coverExpression(falsyValue, 1);
```

# Boolean Expressions

```ts
// untouched version
if (a && b) {
  // something
}

// turns into
__coverReportExpression(fileName, line, col, 0);
if (a && __coverExpression(0, b)) {
  // something
}
```

# while and for loops

```ts
__coverReportBlock(fileName, line, col, 0);
__coverReportBlock(fileName, line2, col2, 1);

for (let i = 0; i < 100; i++) {
  __coverBlock(0);
}

while (true) {
  __coverBlock(1);
  break;
}
```

# Switch Case

```ts
__coverReportBlock(fileName, line, col, 0);
__coverReportBlock(fileName, line2, col2, 1);
__coverReportBlock(fileName, line3, col3, 2);

switch (expression) {
  case a:
    __coverBlock(0);
  case b:
    __coverBlock(1);
  default:
    __coverBlock(2);
}
```
