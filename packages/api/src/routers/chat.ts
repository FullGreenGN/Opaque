import prisma from "@opaque/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

export const chatRouter = router({
	// Returns the caller's conversations with the last message still as
	// ciphertext — decryption happens client-side only.
	getConversations: protectedProcedure.query(async ({ ctx }) => {
		const participants = await prisma.conversationParticipant.findMany({
			where: { userId: ctx.session.user.id },
			orderBy: { conversation: { updatedAt: "desc" } },
			include: {
				conversation: {
					include: {
						participants: {
							include: {
								user: {
									select: { id: true, name: true, image: true },
								},
							},
						},
						messages: {
							orderBy: { createdAt: "desc" },
							take: 1,
						},
					},
				},
			},
		});

		return participants.map(({ conversation, lastReadAt }) => ({
			id: conversation.id,
			type: conversation.type,
			encryptedName: conversation.encryptedName,
			updatedAt: conversation.updatedAt,
			lastReadAt,
			participants: conversation.participants.map((p) => p.user),
			lastMessage: conversation.messages[0] ?? null,
		}));
	}),

	// Cursor-paginated encrypted message payloads for a single conversation.
	// Membership is checked before any rows are returned.
	getMessages: protectedProcedure
		.input(
			z.object({
				conversationId: z.string(),
				cursor: z.string().nullish(),
				limit: z.number().int().min(1).max(100).default(50),
			}),
		)
		.query(async ({ ctx, input }) => {
			const membership = await prisma.conversationParticipant.findUnique({
				where: {
					conversationId_userId: {
						conversationId: input.conversationId,
						userId: ctx.session.user.id,
					},
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			const rows = await prisma.message.findMany({
				where: { conversationId: input.conversationId },
				orderBy: { createdAt: "desc" },
				take: input.limit + 1,
				...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
			});

			let nextCursor: string | undefined;
			if (rows.length > input.limit) {
				nextCursor = rows.pop()?.id;
			}

			return {
				messages: rows.reverse(),
				nextCursor,
			};
		}),
});
