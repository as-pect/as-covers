let value = 0

// @as-covers: ignore
{
  if (true) {
    value += 1
  }

  if (false) {
    value += 2
  }
}
