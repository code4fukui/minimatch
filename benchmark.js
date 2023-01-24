import minimatch from "./minimatch.js";
import expand from "https://code4fukui.github.io/brace-expansion/index.js";

const pattern = "**/*.js";

const files = expand("x/y/z/{1..1000}.js");
const start = performance.now();

for (let i = 0; i < 1000; i++) {
  for (let f = 0; f < files.length; f++) {
    const res = minimatch(pattern, files[f])
  }
  if (!(i % 10)) console.log('.')
}
console.log("done")
const dur = performance.now() - start;
console.log("%s ms", dur);
