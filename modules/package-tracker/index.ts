import { read, add, remove } from "./utils/packages";
import { Server } from "../../server";
import refresh from "./refresh";
import { Logger } from "../../helpers";

const logger = new Logger("package-tracker");

export default async function packageTracker(server: Server) {
  await server.register(
    async (instance) => {
      instance.get("/list", read);

      instance.post<{ Body: { name: string; code: string } }>(
        "/add",
        async (req) => {
          const item = { name: req.body.name, code: req.body.code };

          await add(item);
          await refresh();

          logger.log("added: ", JSON.stringify(item));
        }
      );

      instance.post<{ Body: { code: string } }>("/remove", async (req) => {
        const { code } = req.body;

        await remove(code);
        await refresh();

        logger.log("removed: ", code);
      });

      instance.get("/refresh", async () => {
        await refresh();
      });
    },
    { prefix: "/package-tracker" }
  );

  logger.log("loaded");
}
