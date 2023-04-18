import fs from "fs";
type CratesMap = { [columnId: number]: string[] };
interface Action {
  how_many: number;
  from: number;
  to: number;
}
type ActionList = Action[];

const crate_regex = /\[[A-Z]\]/g;
const number_regex = /\d+/g;
const action_regex = /move (?<how_many>\d+) from (?<from>\d+) to (?<to>\d+)/;
const parseInput = (input: string) => {
  const createEntryState = (crates: CratesMap, length: number) => {
    let entry_state: string[][] = [];
    for (let idx = 0; idx < length; idx++) {
      entry_state[idx] = crates[idx] || [];
    }
    return entry_state;
  };

  const lines = input.split("\n");
  const crates: CratesMap = {};
  let should_read_crates = true;
  let entry_state: string[][] = [];
  const actions: ActionList = [];

  const readAction = (line: string) => {
    const action = line.match(action_regex);
    if (!action) {
      return;
    }
    const { groups } = action;
    const { how_many, from, to } = groups || {};
    actions.push({
      how_many: Number.parseInt(how_many),
      from: Number.parseInt(from),
      to: Number.parseInt(to),
    });
  };
  const readBlocks = (line: string) => {
    const blocks = [...line.matchAll(crate_regex)];
    blocks.forEach((block) => {
      const column = (block.index || 0) / 4; // every crate takes 4 characters in input
      crates[column] = (crates[column] || []).concat(block[0]);
    });
  };
  const parseLine = (line: string) => {
    if (!should_read_crates) {
      return readAction(line);
    }
    // should_read_crates = true
    const numbers = [...line.matchAll(number_regex)];
    if (numbers.length > 0) {
      // line with inexes of columns, tells us how many columns there are
      should_read_crates = false; // we don't read crates anymore
      entry_state = createEntryState(crates, numbers.length); // we can create state according to the collected crates information and columns number
      return;
    }
    // else we still read crates
    readBlocks(line);
  };
  for (const line of lines) {
    parseLine(line);
  }
  return {
    entry_state,
    actions,
  };
};

export default function main() {
  const input = fs.readFileSync("input.txt");
  const { entry_state, actions } = parseInput(input.toString());
  console.log(entry_state, actions);
}
main();
