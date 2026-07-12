import { auth } from "@opaque/auth";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";

export async function createContext({ req }: CreateFastifyContextOptions) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	return {
		auth: null,
		session,
		ip: req.ip,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
