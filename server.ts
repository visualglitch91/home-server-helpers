import Fastify from "fastify";

const server = Fastify();

export type Server = typeof server;
export default server;
