import path from "path";
import { promises as fs } from "fs";
import { dataFile } from "../config.json";

let filepath = dataFile;

if (!path.isAbsolute(filepath)) {
  filepath = path.resolve(path.join(__dirname, "..", filepath));
}

export interface Item {
  name: string;
  code: string;
  lastEvent?: {
    at: string;
    description: string;
    location: string;
  };
}

export function write(packages: Item[]) {
  return fs.writeFile(filepath, JSON.stringify(packages, null, 2));
}

export async function read() {
  try {
    const raw = (await fs.readFile(filepath)).toString();
    return JSON.parse(raw) as Item[];
  } catch (_) {
    return [];
  }
}

export async function add(item: Item) {
  const packages = await read();
  packages.push(item);
  return write(packages);
}

export async function remove(code: string) {
  const packages = (await read()).filter((it) => it.code !== code);
  return write(packages);
}
