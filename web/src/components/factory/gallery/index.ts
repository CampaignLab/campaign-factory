// Presenter Factory Gallery (W5). The renderer (FactoryGallery) is a pure
// function of the event view model; GalleryLive owns transport. W7 replay reuses
// FactoryGallery directly with folded stored events.

export { FactoryGallery } from "./FactoryGallery";
export { GalleryLive } from "./GalleryLive";
export {
  deriveShortName,
  type GalleryCampaign,
} from "./viewModel";
export { rememberBatch, getBatch } from "./batchStorage";
export type { StoredBatchConnection } from "./batchStorage";
