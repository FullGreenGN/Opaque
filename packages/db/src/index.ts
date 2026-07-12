import { env } from "@opaque/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";

export * from "../prisma/generated/enums";
export type * from "../prisma/generated/models";

export function createPrismaClient() {
	const adapter = new PrismaPg({
		connectionString: env.DATABASE_URL,
	});
	return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
