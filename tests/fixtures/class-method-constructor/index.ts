// Covers class constructors and methods.
class Counter {
  value: i32

  constructor(value: i32) {
    this.value = value
  }

  increment(): void {
    this.value += 1
  }

  unused(): void {
    this.value -= 1
  }
}

const counter = new Counter(1)
counter.increment()
