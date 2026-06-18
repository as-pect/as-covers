// Covers loop bodies that omit braces.
let forCount = 0
let whileCount = 0
let doCount = 0

for (let i = 0; i < 1; i++) forCount += 1
for (let j = 0; j < 0; j++) forCount += 1

while (whileCount < 1) whileCount++
while (whileCount < 0) whileCount++

do doCount++ while (doCount < 1)
do doCount++ while (false)
