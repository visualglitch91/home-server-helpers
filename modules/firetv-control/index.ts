import { exec } from "child_process";
import { Server } from "../../server";
import got from "got";
import PQueue from "p-queue";
import { adbHost, restKeyboardHost } from "./config.json";
import { Logger } from "../../helpers";

const queue = new PQueue({ concurrency: 1 });
const logger = new Logger("firetv-control");

function adbShell(...cmds: string[]) {
  return queue.add(() => {
    return new Promise<void>((resolve) => {
      const fullCmd = [
        `adb connect ${adbHost}`,
        ...cmds.map((cmd) => `adb shell ${cmd}`),
        `adb disconnect ${adbHost}`,
      ].join(" && ");

      exec(fullCmd, (...args) => {
        logger.log(`command: ${fullCmd}`);
        logger.log(`response: ${args}`);
        resolve();
      });
    });
  });
}

export default async function fireTVControl(server: Server) {
  await server.register(
    async (instance) => {
      instance.get<{ Params: { activity: string } }>(
        "/launch/:activity",
        async (req) => {
          const { activity } = req.params;

          logger.log("launch:", activity);

          await adbShell("input keyevent KEYCODE_HOME", `am start ${activity}`);
        }
      );

      instance.get<{ Params: { keycode: string } }>(
        "/keycode/:keycode",
        async (req) => {
          const { keycode } = req.params;

          logger.log("keycode:", keycode);

          await adbShell(`input keyevent ${keycode}`);
        }
      );

      instance.get<{ Params: { button: string } }>(
        "/button/:button",
        async (req) => {
          const { button } = req.params;

          logger.log("button:", button);

          await got.get(`http://${restKeyboardHost}/${button}`);
        }
      );
    },
    { prefix: "/firetv-control" }
  );

  logger.log("loaded");
}
