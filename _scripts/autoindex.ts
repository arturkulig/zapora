import { glob, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const INTENDED_TOKEN = "// autoindex";

for await (const index of glob("./**/index.ts", {
  cwd: resolve(import.meta.dirname, "../"),
})) {
  if (index.match(/^node_modules/) != null) {
    continue;
  }

  const [indexFirstLine] = (await readFile(index, { encoding: "utf-8" })).split(
    "\n",
  );

  if (!indexFirstLine.startsWith(INTENDED_TOKEN)) {
    continue;
  }

  const newContents = [INTENDED_TOKEN];

  for await (const moduleFile of glob(`./*.ts`, {
    cwd: dirname(index),
  })) {
    if (
      moduleFile.match(/spec\.ts$/) != null ||
      moduleFile.match(/^index\.ts$/) != null
    ) {
      continue;
    }

    newContents.push(`export * from "./${basename(moduleFile, ".ts")}";`);
  }

  await writeFile(index, newContents.join("\r\n").concat("\r\n"), {
    encoding: "utf-8",
  });
}

await new Promise((r) => setTimeout(r, 100));
