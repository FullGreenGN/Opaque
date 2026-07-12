import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@opaque/ui/components/input-group";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MessageComposer({
	conversationId,
}: {
	conversationId: string;
}) {
	const [draft, setDraft] = useState("");

	const handleSend = () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			return;
		}

		// Sending isn't wired to the server yet: the draft still needs to be
		// sealed client-side (encryptMessage in @/lib/zero-knowledge) with the
		// conversation's session key before a future chat.sendMessage mutation
		// can carry it — sending raw plaintext through tRPC would defeat the
		// zero-knowledge design, so we stop here for now.
		toast.info(
			"Sending is not wired up yet — messages are encrypted client-side first",
		);
		setDraft("");
	};

	return (
		<div className="border-border border-t p-3">
			<InputGroup>
				<InputGroupTextarea
					placeholder="Write an encrypted message…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					aria-label={`Message for conversation ${conversationId}`}
				/>
				<InputGroupAddon align="block-end">
					<InputGroupButton
						type="button"
						size="icon-sm"
						variant="default"
						disabled={!draft.trim()}
						onClick={handleSend}
						className="ml-auto"
					>
						<SendIcon />
						<span className="sr-only">Send</span>
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}
