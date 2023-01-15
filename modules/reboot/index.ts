import { exec } from "child_process";
import { Server } from "../../server";
import { Logger } from "../../helpers";
import { cmd } from "./config.json";

const logger = new Logger("reboot");

export default async function reboot(server: Server) {
  await server.get("/reboot", async () => {
    return new Promise<void>((resolve) => {
      logger.log("rebooting...");
      exec(cmd, () => resolve());
    });
  });

  logger.log("loaded");
}
