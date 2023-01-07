import { TwitterApi } from "twitter-api-v2";
import config from "./config.json";

export type TwitterClient = ReturnType<typeof createTwitterClient>;

export default function createTwitterClient(username: string) {
  const userConfig = config[username as keyof typeof config];
  const version = userConfig.apiVersion as "v1" | "v2";

  const credentials = {
    appKey: userConfig.consumerKey,
    appSecret: userConfig.consumerSecret,
    accessToken: userConfig.accessToken,
    accessSecret: userConfig.accessTokenSecret,
  };

  if (version === "v1") {
    const client = new TwitterApi(credentials).v1;

    return {
      userTimeline: client.userTimeline.bind(client),
      deleteTweet: client.deleteTweet.bind(client),
      me: () => {
        return client.verifyCredentials().then((user) => ({
          data: {
            id: user.id_str,
            name: user.name,
            username: user.screen_name,
          },
        }));
      },
    };
  }

  const client = new TwitterApi(credentials).v2;

  return {
    me: client.me.bind(client),
    deleteTweet: client.deleteTweet.bind(client),
    userTimeline: client.userTimeline.bind(client),
  };
}
