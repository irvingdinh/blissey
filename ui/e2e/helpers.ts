import type { APIRequestContext } from "@playwright/test";

const API = "http://localhost:3000";

/**
 * Wipe all posts, trash and drafts so every test starts from a clean slate.
 * Call this in `beforeEach` to prevent data pollution across tests and projects.
 *
 * Because the API only supports soft-delete for posts, the cleanup strategy is:
 *   1. Restore every trashed post (moving them back to active)
 *   2. Soft-delete every active post (moving them all to trash)
 *   3. Delete all drafts
 *
 * After this, the feed is empty and trash contains all historical posts.
 * If you also need an empty trash, call `cleanTrash` after this.
 */
export async function cleanAll(request: APIRequestContext) {
  // 1. Restore every trashed post so we have a single source of truth
  const trashRes = await request.get(`${API}/api/trash`);
  const trashedPosts = await trashRes.json();
  for (const post of trashedPosts) {
    await request.post(`${API}/api/trash/${post.id}/restore`);
  }

  // 2. Soft-delete every active post (paginate to catch all)
  let hasMore = true;
  while (hasMore) {
    const postsRes = await request.get(`${API}/api/posts?limit=100`);
    const postsBody = await postsRes.json();
    const posts = postsBody.data ?? [];
    if (posts.length === 0) {
      hasMore = false;
    } else {
      for (const post of posts) {
        await request.delete(`${API}/api/posts/${post.id}`);
      }
    }
  }

  // 3. Delete all drafts
  const draftsRes = await request.get(`${API}/api/drafts`);
  const drafts = await draftsRes.json();
  for (const draft of drafts) {
    await request.delete(`${API}/api/drafts/${draft.id}`);
  }
}

/**
 * Restore every item from trash so the trash page is empty.
 * The restored posts become active and will appear in the feed.
 * Use this for trash-specific tests that need an empty trash.
 */
export async function cleanTrash(request: APIRequestContext) {
  const trashRes = await request.get(`${API}/api/trash`);
  const trashedPosts = await trashRes.json();
  for (const post of trashedPosts) {
    await request.post(`${API}/api/trash/${post.id}/restore`);
  }
}
