import got from "got";
import { TuyaContext } from "@tuya/tuya-connector-nodejs";
import { Server } from "../../server";
import config from "./config.json";
import { Logger } from "../../helpers";

const {
  tuyaAPI: { baseUrl, accessKey, secretKey },
  devices,
  interval,
} = config;

const logger = new Logger("tuya-water-leak-notifier");

const context = new TuyaContext({
  baseUrl,
  accessKey,
  secretKey,
});

const state: Record<string, typeof devices[number] & { status: string }> = {};

async function getDeviceStatus(deviceId: string) {
  const response = await context.request<any>({
    method: "GET",
    path: `/v1.0/devices/${deviceId}/status`,
  });

  if (!response.success) {
    return "offline";
  }

  return (
    response.result.find((it: any) => it.code === "watersensor_state")?.value ||
    "offline"
  );
}

async function loop() {
  await Promise.all(
    devices.map(async (config) => {
      const current = {
        ...config,
        status: await getDeviceStatus(config.id),
      };

      const prev = state[config.id];

      if (current.status !== prev?.status) {
        state[config.id] = current;

        logger.log(`${config.name}: ${current.status}`);

        if (current.status === "alarm") {
          got.post(config.alarmWebhook);
        }
      }
    })
  );

  setTimeout(loop, interval);
}

export default function tuyaWaterLeakNotifier(_: Server) {
  loop();
  logger.log("loaded");
}
