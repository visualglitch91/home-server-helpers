import got from "got";
import WebSocket from "ws";
import { Logger } from "../../helpers";
import { Server } from "../../server";
import { host, token } from "./config.json";

const logger = new Logger("hass-integration-control");

function toggle(ids: string[], action: "enable" | "disable") {
  return new Promise<void>((resolve) => {
    const ws = new WebSocket(`ws://${host}/api/websocket`);

    logger.log(action, ids);

    ws.on("open", () => {
      let i = 1;

      ws.send(
        JSON.stringify({
          type: "auth",
          access_token: token,
        })
      );

      setTimeout(() => {
        ids.forEach((id) => {
          const data = {
            type: "config_entries/disable",
            entry_id: id,
            disabled_by: action === "disable" ? "user" : null,
            id: i++,
          };

          ws.send(JSON.stringify(data));
        });

        setTimeout(() => {
          ws.close();
          resolve();
        }, 500);
      }, 500);
    });
  });
}

export default async function packageTracker(server: Server) {
  await server.register(
    async (instance) => {
      instance.post<{ Body: { ids: string[] } }>("/enable", async (req) => {
        await toggle(req.body.ids, "enable");
      });

      instance.post<{ Body: { ids: string[] } }>("/disable", async (req) => {
        await toggle(req.body.ids, "disable");
      });

      instance.post<{ Body: { ids: string[] } }>("/reload", async (req) => {
        const { ids } = req.body;

        logger.log("reload", ids);

        for (let id of ids) {
          await got
            .post(`http://${host}/api/config/config_entries/entry/${id}/reload`, { headers: {Authorization: `Bearer ${token}`}})
            .json();
        }
      });
    },
    { prefix: "/hass-integration-control" }
  );

  logger.log("loaded");
}
