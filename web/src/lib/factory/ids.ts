// One home for the campaign/batch-id shape guard.
//
// Campaign ids and batch ids are Postgres UUIDs. A request path can carry any
// string, so before an id reaches a `WHERE id = $1` query every id-taking
// route/page must reject non-UUID shapes itself: Postgres raises 22P02
// (invalid_text_representation) on a malformed uuid literal, which would
// surface as a 500. The contract is a 404 (unknown id), so callers guard with
// this first and return their own not-found response instead.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidId(id: string): boolean {
  return UUID_RE.test(id);
}
