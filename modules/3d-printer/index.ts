//@ts-expect-error
import humanizeDuration from "humanize-duration";
import got from "got";
import { Server } from "../../server";
import { Logger } from "../../helpers";
import { host, token } from "./config.json";

const logger = new Logger("3d-printer");

export default async function ThreeDPrinter(server: Server) {
  await server.register(
    async (instance) => {
      instance.post<{
        Body: { eta: string };
      }>("/announce-eta", async (req) => {
        //@ts-ignore
        const timeLeftMs = new Date(req.body.eta) - new Date();

        const timeLeft = humanizeDuration(timeLeftMs, {
          language: "pt",
          largest: 2,
          units: ["d", "h", "m"],
          round: true,
        });

        const message = `Restam ${timeLeft}`;

        logger.log(message);

        await got
          .post(`http://${host}/api/services/notify/alexa_media_sala_echo`, {
            headers: { Authorization: `Bearer ${token}` },
            json: { message, data: { type: "tts" } },
          })
          .json();
      });
    },
    { prefix: "/3d-printer" }
  );

  logger.log("loaded");
}
