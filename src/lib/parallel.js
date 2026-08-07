/* Run async work over a list with a cap on how much is in flight at once.
 *
 * Ten images one after another means minutes of waiting; ten at once risks
 * rate limits and a bill spike if something is wrong with the prompt. A small
 * window is the compromise — and results stay in input order regardless of
 * which finishes first, which matters because the order IS the dream.
 */
export async function mapWithLimit(items, limit, worker) {
  const list = Array.from(items || []);
  const results = new Array(list.length);
  const width = Math.max(1, Math.min(limit || 1, list.length));
  let next = 0;

  async function run() {
    while (true) {
      const i = next++;
      if (i >= list.length) return;
      results[i] = await worker(list[i], i);
    }
  }

  // One rejection aborts the whole batch — a half-generated dream sequence is
  // not something to hand back as if it were complete.
  await Promise.all(Array.from({ length: width }, run));
  return results;
}
