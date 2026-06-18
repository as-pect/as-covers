// Covers arrow expression bodies by expecting the body call to run.
function mark(): void {}

const covered = (): void => mark()
const uncovered = (): void => mark()

covered()
