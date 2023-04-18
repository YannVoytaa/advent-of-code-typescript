import fs from "fs";

const findStartOfMarker = (input: string) =>
  input
    .split("")
    .findIndex(
      (_, idx, arr) =>
        idx >= 3 && new Set(arr.slice(idx - 3, idx + 1)).size == 4
    );
export default function main(filepath: string) {
  const input = fs.readFileSync(filepath);
  const result = findStartOfMarker(input.toString());
  return result + 1; // findStartOfMarker's result is 0-based
}
console.log(main("input.txt"));
