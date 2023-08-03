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
      instance.post<{ Body: { activity: string } }>("/launch", async (req) => {
        const { activity } = req.body;

        logger.log("launch:", activity);

        await adbShell("input keyevent KEYCODE_HOME", `am start ${activity}`);
      });

      instance.post("/reboot", async () => {
        logger.log("reboot");
        await adbShell("reboot userspace");
      });

      instance.post<{ Body: { keycode: string } }>("/keycode", async (req) => {
        const { keycode } = req.body;

        logger.log("keycode:", keycode);

        await adbShell(`input keyevent ${keycode}`);
      });

      instance.post<{ Body: { button: string } }>("/button", async (req) => {
        const { button } = req.body;

        logger.log("button:", button);

        await Promise.all([
          adbShell("input keyevent REFRESH"),
          got.get(`http://${restKeyboardHost}/${button}`),
        ]);
      });

      instance.post("/max-volume", () =>
        adbShell("cmd media_session volume --set 15")
      );
    },
    { prefix: "/firetv-control" }
  );

  logger.log("loaded");
}
