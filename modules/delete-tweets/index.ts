import sub from "date-fns/sub";
import uniqBy from "lodash/uniqBy";
import { Server } from "../../server";
import { Logger } from "../../helpers";
import createTwitterClient, { TwitterClient } from "./twitter";

const logger = new Logger("delete-tweets");

const ignoredErrors = [
  "User has been suspended.",
  "No status found with that ID.",
  "Sorry, that page does not exist.",
  "Sorry, you are not authorized to see this status.",
];

async function getLatest3200Tweets(twitter: TwitterClient) {
  const { data: user } = await twitter.me();

  const userTimeline = await twitter.userTimeline(user.id, {
    "tweet.fields": ["created_at"],
  });

  if (userTimeline.done) {
    return [];
  }

  await userTimeline.fetchLast(3200);

  // normalize v1 ids
  let tweets = userTimeline.tweets.map((it) => ({
    //@ts-expect-error
    id: it.id_str || it.id,
    created_at: it.created_at,
    //@ts-expect-error
    text: it.full_text || it.text,
  }));

  // remove duplicated tweets
  tweets = uniqBy(tweets, "id");

  return tweets;
}

type TTL = [number, "days" | "hours" | "minutes"];

async function run(username: string, ttl: TTL) {
  logger.log(`Fetching tweets older than ${ttl[0]} ${ttl[1]} ago`);

  try {
    const [ttlAmount, ttlUnit] = ttl;
    const until = sub(new Date(), { [ttlUnit]: ttlAmount });

    const twitter = createTwitterClient(username);

    const tweets = await getLatest3200Tweets(twitter);

    const tweetsToDelete = tweets.filter(
      (tweet) => new Date(tweet.created_at!) < until
    );

    logger.log(`Starting to delete ${tweetsToDelete.length} tweets`);

    for (let tweet of tweetsToDelete) {
      logger.log(`Deleting tweet ${tweet.id}`);

      await twitter
        .deleteTweet(tweet.id)
        .catch((err) =>
          ignoredErrors.includes(err.message) ? null : Promise.reject(err)
        )
        .catch(logger.log);
    }

    logger.log("Tweets deleted!");
  } catch (err) {
    logger.log("Error", err);
  }
}

export default function deleteTweets(server: Server) {
  server.post<{
    Body: { username: string; ttl: string };
  }>("/delete-tweets", async (req) => {
    logger.log(req.body);
    await run(req.body.username, req.body.ttl.split(" ") as TTL);
  });

  logger.log("loaded");
}
