export function queuePosition(allQueuedIds: string[], jobId: string): number | undefined {
  const idx = allQueuedIds.indexOf(jobId);
  return idx === -1 ? undefined : idx + 1;
}
export function isTerminal(status: string) { return ['done','failed','cancelled'].includes(status); }
export function publicJob(row: any, events: any[] = [], queuePos?: number) {
  return { id: row.id, status: row.status, queuePosition: queuePos, createdAt: row.created_at, updatedAt: row.updated_at, gifUrl: row.gif_url, mp4Url: row.mp4_url, sourceUrl: row.source_bundle_url, errorMessage: row.error_message, events: events.map(e => ({ id: e.id, createdAt: e.created_at, level: e.level, message: e.message })) };
}
