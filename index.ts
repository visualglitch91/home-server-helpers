import server, { Server } from "./server";

const port = 3000;

const modules = import.meta.glob<{
  default: (server: Server) => Promise<void>;
}>("./modules/*/index.ts", {
  eager: true,
});

(async () => {
  console.log("modules found:", Object.keys(modules));

  for (let key in modules) {
    const { default: mod } = modules[key];
    await mod(server);
  }

  console.log("Listening on port", port);
  server.listen({ host: "0.0.0.0", port });
})();
