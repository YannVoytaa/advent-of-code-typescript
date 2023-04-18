import fs from "fs";

const TO_BE_DISTINCT = 14;
const findStartOfMarker = (input: string) =>
  input
    .split("")
    .findIndex(
      (_, idx, arr) =>
        idx >= TO_BE_DISTINCT - 1 &&
        new Set(arr.slice(idx - (TO_BE_DISTINCT - 1), idx + 1)).size ==
          TO_BE_DISTINCT
    );
export default function main(filepath: string) {
  const input = fs.readFileSync(filepath);
  const result = findStartOfMarker(input.toString());
  return result + 1; // findStartOfMarker's result is 0-based
}
console.log(main("input.txt"));
