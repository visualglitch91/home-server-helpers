import { exec } from "child_process";
import fastifyStatic from "@fastify/static";
import { Server } from "../../server";
import { Logger, withRetry } from "../../helpers";
import config from "./config.json";

const cameras = config as Record<string, string>;
const snapshotDir = `${__dirname}/snapshots/`;
const logger = new Logger("camera-snapshots");

function captureSnapshot(name: string, source: string) {
  const tmpFile = `${snapshotDir}/${name}-tmp.jpg`;
  const finalFile = `${snapshotDir}/${name}.jpg`;

  const command = `
    rm -rf ${tmpFile} &&
    /usr/bin/ffmpeg -i ${source} -ss 00:00:01 -f image2 -vframes 1 ${tmpFile} &&
    rm -rf ${finalFile} &&
    mv ${tmpFile} ${finalFile}
  `;

  return new Promise<void>((resolve, reject) =>
    exec(command, (err) => {
      if (err) {
        return reject();
      }

      resolve();
    })
  );
}

async function loop() {
  for (const name in cameras) {
    await withRetry(() => captureSnapshot(name, cameras[name]), 500, 1).catch(
      () => {}
    );
  }

  setTimeout(loop, 10_000);
}

export default async function cameraSnapshots(server: Server) {
  loop();

  await server.register(fastifyStatic, {
    root: snapshotDir,
    prefix: "/camera-snapshots/",
  });

  logger.log("loaded");
}
