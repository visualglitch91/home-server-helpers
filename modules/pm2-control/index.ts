import { exec } from "child_process";
import { Server } from "../../server";
import { Logger } from "../../helpers";
import { bin } from "./config.json";

const logger = new Logger("pm2-control");

function pm2(method: string, name: string) {
  return new Promise<void>((resolve) => {
    logger.log(`${method}: ${name}`);
    exec(`${bin} ${method} ${name}`, () => resolve());
  });
}

export default async function pm2Control(server: Server) {
  await server.register(
    async (instance) => {
      instance.get<{ Params: { name: string } }>(
        "/start/:name",
        async (req) => {
          await pm2("start", req.params.name);
        }
      );

      instance.get<{ Params: { name: string } }>(
        "/restart/:name",
        async (req) => {
          await pm2("restart", req.params.name);
        }
      );

      instance.get<{ Params: { name: string } }>("/stop/:name", async (req) => {
        await pm2("stop", req.params.name);
      });
    },
    { prefix: "/pm2-control" }
  );

  logger.log("loaded");
}
