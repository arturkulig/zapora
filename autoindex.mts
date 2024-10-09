import { glob, open } from "node:fs/promises";
import { basename, dirname } from "node:path";

for await (const index of glob("./**/index.ts")) {
  if (index.match(/^node_modules/) != null) {
    continue;
  }

  const fh = await open(index, "w");

  for await (const moduleFile of glob(`./*.ts`, {
    cwd: dirname(index),
  })) {
    if (moduleFile.match(/spec\.ts$/) != null) {
      continue;
    }

    await fh.writeFile(`export * from "./${basename(moduleFile, ".ts")}";\n`, {
      encoding: "utf-8",
    });
  }

  await fh.close();
}

await new Promise((r) => setTimeout(r, 100));
