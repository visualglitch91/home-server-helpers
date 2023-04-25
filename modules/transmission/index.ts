import { exec } from "child_process";
import { Server } from "../../server";
import { Logger } from "../../helpers";
import { bin, auth } from "./config.json";

const logger = new Logger("transmission");

function run(...args: string[]) {
  const cmd = [bin, auth, ...args].join(" ");

  return new Promise<void>((resolve) => {
    logger.log(cmd);
    exec(cmd, () => resolve());
  });
}

export default async function transmission(server: Server) {
  await server.register(
    async (instance) => {
      instance.post<{
        Body: { torrent: string; directory: string };
      }>("/add", async (req) => {
        await run(
          "--add",
          `"${req.body.torrent}"`,
          "--download-dir",
          `"${req.body.directory}"`
        );
      });
    },
    { prefix: "/transmission" }
  );

  logger.log("loaded");
}
