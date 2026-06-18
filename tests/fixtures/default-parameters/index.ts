// Exposes default parameter initializer coverage.
function usesDefault(value: i32 = 1): i32 { return value }

function skipsDefault(value: i32 = 2): i32 { return value }

usesDefault()
skipsDefault(3)
