import fs from "fs";
import { inspect } from "util";
type FileSystem = {
  root: Directory;
};
type Node = Directory | File;
function nodeIsDir(node: Node): node is Directory {
  return !!(node as Directory)?.subNodes;
}
function nodeIsFile(node: Node): node is File {
  return !!(node as File)?.size;
}
interface Directory {
  subNodes: { [name: string]: Node };
  parent: Directory | null;
}
interface File {
  size: number;
}
type Action = CDAction | LSAction;
type CDAction = {
  action: "cd";
  name: string;
};
type LSAction = {
  action: "ls";
  subNodes: { [name: string]: Node };
};
const cd_action = /\$ cd (?<name>.+)/;
const ls_action = /\$ ls/g;
const dir_ls = /dir (?<name>.+)/;
const file_ls = /(?<size>\d+) (?<name>.+)/;
const EMPTY_DIR = { subNodes: {}, parent: null };
const ROOT_PATH = "/";
const BACK_PATH = "..";
const createFileSystem = (actions: Action[]) => {
  const fileSystem: FileSystem = {
    root: EMPTY_DIR,
  };
  let currentNode = fileSystem.root;
  function cd(node: Directory, name: string): Directory {
    const res =
      name == ROOT_PATH
        ? fileSystem.root
        : name == BACK_PATH
        ? node.parent
        : node.subNodes[name];
    if (!res) {
      throw new Error(`Cannot cd to ${name}; not found`);
    }
    if (!nodeIsDir(res)) {
      throw new Error(
        `Cannot cd to ${name}; it's a file (you can only cd to directories)`
      );
    }
    return res;
  }
  function addParentToSubNodes(
    subnodes: {
      [name: string]: Node;
    },
    parent: Directory
  ): {
    [name: string]: Node;
  } {
    return Object.fromEntries(
      Object.entries(subnodes).map(([name, node]) => [
        name,
        { ...node, parent },
      ])
    );
  }
  function execute(node: Directory, action: Action): Directory {
    if (action.action === "cd") {
      return cd(node, action.name);
    } else if (action.action === "ls") {
      node.subNodes = addParentToSubNodes(action.subNodes, node);
      return node;
    }
    throw new Error("Action not allowed");
  }
  for (const action of actions) {
    currentNode = execute(currentNode, action);
  }
  return fileSystem;
};
const parseInput = (input: string) => {
  const actions: Action[] = [];

  const lines = input.split("\n");
  let is_during_ls = false;
  let current_ls_subnodes: { [name: string]: Node } = {};
  for (const line of lines) {
    const is_cd_action = line.match(cd_action);
    const is_ls_action = line.match(ls_action);
    const is_dir_ls = line.match(dir_ls);
    const is_file_ls = line.match(file_ls);
    if (!is_dir_ls && !is_file_ls && is_during_ls) {
      // ls has just ended
      is_during_ls = false;
      actions.push({
        action: "ls",
        subNodes: current_ls_subnodes,
      });
      current_ls_subnodes = {};
    }
    if (is_cd_action?.groups) {
      actions.push({
        action: "cd",
        name: is_cd_action.groups.name,
      });
    } else if (is_ls_action) {
      is_during_ls = true;
    } else if (is_dir_ls?.groups) {
      current_ls_subnodes[is_dir_ls.groups.name] = EMPTY_DIR;
    } else if (is_file_ls?.groups) {
      current_ls_subnodes[is_file_ls.groups.name] = {
        size: Number.parseInt(is_file_ls.groups.size),
      };
    }
  }
  if (is_during_ls) {
    is_during_ls = false;
    actions.push({
      action: "ls",
      subNodes: current_ls_subnodes,
    });
    current_ls_subnodes = {};
  }
  return actions;
};

const SIZE_THRESHOLD = 100_000;
const sumSmallDirectories = (fileSystem: FileSystem) => {
  type TotalSum = number;
  type SumOfSmaller = number;
  function getTotalAndSumSmaller(dir: Directory): [TotalSum, SumOfSmaller] {
    let myTotal = 0;
    let sumOfSmaller = 0;
    for (const node of Object.values(dir.subNodes)) {
      if (nodeIsDir(node)) {
        const [total, sum] = getTotalAndSumSmaller(node);
        myTotal += total;
        sumOfSmaller += sum;
      } else {
        // node is file
        myTotal += node.size;
      }
    }
    return [
      myTotal,
      myTotal <= SIZE_THRESHOLD ? myTotal + sumOfSmaller : sumOfSmaller,
    ];
  }
  return getTotalAndSumSmaller(fileSystem.root);
};

const findSmallestBiggerThan = (fileSystem: FileSystem, toRemove: number) => {
  type TotalSum = number;
  type SmallestBigger = number;
  function getTotalAndSmallestBigger(
    dir: Directory
  ): [TotalSum, SmallestBigger] {
    let myTotal = 0;
    let smallestBigger = Number.MAX_SAFE_INTEGER;
    for (const node of Object.values(dir.subNodes)) {
      if (nodeIsDir(node)) {
        const [total, smallestInSubdir] = getTotalAndSmallestBigger(node);
        myTotal += total;
        smallestBigger =
          smallestInSubdir >= toRemove && smallestInSubdir < smallestBigger
            ? smallestInSubdir
            : smallestBigger;
      } else {
        // node is file
        myTotal += node.size;
      }
    }
    return [
      myTotal,
      myTotal >= toRemove && smallestBigger > myTotal
        ? myTotal
        : smallestBigger,
    ];
  }
  return getTotalAndSmallestBigger(fileSystem.root);
};

const DISK_SPACE = 70000000;
const NEEDED_SPACE = 30000000;
export default function main(filepath: string) {
  const input = fs.readFileSync(filepath);
  const actions = parseInput(input.toString());
  const fileSystem = createFileSystem(actions);
  //   const result = sumSmallDirectories(fileSystem)[1];
  const total = sumSmallDirectories(fileSystem)[0];
  const toRemove = total - (DISK_SPACE - NEEDED_SPACE);
  const result = findSmallestBiggerThan(fileSystem, toRemove)[1];
  return result;
}
console.log(main("input.txt"));
