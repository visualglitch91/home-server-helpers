import got from "got";
import add from "date-fns/add";
import { Server } from "../../server";
import { token, timezone } from "./config.json";
import { Logger } from "../../helpers";

const statuses = {
  coffee: { emoji: ":coffee:", text: "Coffee Break" },
  lunch: { emoji: ":pizza:", text: "Lunch" },
  brb: { emoji: ":warning:", text: "BRB" },
};

const logger = new Logger("slack-status");

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    timeStyle: "short",
    timeZone: timezone,
  });
}

export default function slackStatus(server: Server) {
  server.post<{
    Body: { status: keyof typeof statuses; duration: number };
  }>("/slack-status", async (req) => {
    const { status, duration } = req.body;
    const { emoji, text } = statuses[status];

    const from = new Date();
    const to = add(from, { minutes: duration });

    logger.log(`setting ${text} ${emoji} for ${duration} minutes`);

    const response = await got
      .post("https://slack.com/api/users.profile.set", {
        json: {
          profile: {
            status_text: `${text} (${formatTime(from)} to ${formatTime(to)})`,
            status_emoji: emoji,
            status_expiration: Math.floor(to.getTime() / 1000),
          },
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<any>();

    if (!response || !response.ok === true) {
      return Promise.reject(response.data);
    }
  });

  logger.log("loaded");
}
