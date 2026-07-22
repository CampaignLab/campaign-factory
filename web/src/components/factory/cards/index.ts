// Shared Agent Work Cards (W5). Adopted by W4-assembly (inline Step Workspace)
// and W5's Factory Gallery, and reused by W7 replay. Pure presentational
// components: props in, no fetching, no live clock except the supplied `now`.

export { AgentWorkCard } from "./AgentWorkCard";
export { hueByIndex, hueIndexForPosition } from "./hues";
export { foldAgentToCardVM } from "./cardAdapter";
export type { CardAdaptContext } from "./cardAdapter";
export type { AgentCardVM, CampaignHueIndex } from "./types";
