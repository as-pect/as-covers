# as-covers

This package transforms your software, adding some assemblyscript calls to the host to report code coverage.

# if statements

Any if statements will have the following lines injected into your source code:

```ts
coverReportBlock(fileName, line, col, 0);
coverReportBlock(fileName, line2, col2, 1);

if (condition) {
  coverBlock(0);
  // one branch
} else {
  coverBlock(1);
 // another branch
}
```

# functions

```ts
coverReportFunction(fileName, "a", line, col, 0);
coverReportFunction(fileName, "b", line2, col2, 1);

function a(): void {
  coverFunction(0);
}

function b(): void {
  coverFunction(1);
}
```

# ternary expressions

```ts
coverReportExpression(fileName, line, col, 0);
coverReportExpression(fileName, line2, col2, 1);

let val = condition
  ? coverExpression(truthyValue, 0)
  : coverExpression(falsyValue, 1);
```

# Boolean Expressions

```ts
// untouched version
if (a && b) {
  // something
}

// turns into
coverReportExpression(fileName, line, col, 0);
if (a && coverExpression(0, b)) {
  // something
}
```

# while and for loops

```ts
coverReportBlock(fileName, line, col, 0);
coverReportBlock(fileName, line2, col2, 1);

for (let i = 0; i < 100; i++) {
  coverBlock(0);
}

while (true) {
  coverBlock(1);
  break;
}
```

# Switch Case

```ts
coverReportBlock(fileName, line, col, 0);
coverReportBlock(fileName, line2, col2, 1);
coverReportBlock(fileName, line3, col3, 2);

switch (expression) {
  case a:
    coverBlock(0);
  case b:
    coverBlock(1);
  default:
    coverBlock(2);
}
```
