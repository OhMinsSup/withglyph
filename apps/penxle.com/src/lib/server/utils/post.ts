import { webcrypto } from 'node:crypto';
import { asc, count, eq, inArray } from 'drizzle-orm';
import * as R from 'radash';
import { redis } from '$lib/server/cache';
import { database, PostRevisionContents, PostViews, SpaceCollectionPosts } from '../database';
import { isEmptyContent } from './tiptap';
import type { JSONContent } from '@tiptap/core';
import type { Context } from '../context';
import type { Transaction } from '../database';

export const makePostContentId = async (data: JSONContent[] | null) => {
  if (isEmptyContent(data)) {
    return null;
  }

  const hash = Buffer.from(
    await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data))),
  ).toString('hex');

  const [content] = await database
    .insert(PostRevisionContents)
    .values({ hash, data })
    .onConflictDoNothing()
    .returning({ id: PostRevisionContents.id });

  return content.id;
};

type GetPostViewCountParams = {
  postId: string;
  context: Pick<Context, 'loader'>;
};

export const getPostViewCount = async ({ postId, context }: GetPostViewCountParams) => {
  const loader = context.loader({
    name: 'Post.viewCount',
    load: async (postIds: string[]) => {
      const cached = await redis.mget(postIds.map((id) => `Post:${id}:viewCount`));
      const missedIds = postIds.filter((_, i) => !cached[i]);

      const missed =
        missedIds.length > 0
          ? R.objectify(
              await database
                .select({ postId: PostViews.postId, count: count() })
                .from(PostViews)
                .where(inArray(PostViews.postId, missedIds))
                .groupBy(PostViews.postId),
              (postView) => postView.postId,
            )
          : {};

      return postIds.map((postId, index) => {
        const cachedPostView = cached[index];
        if (cachedPostView) {
          return {
            postId,
            count: Number.parseInt(cachedPostView),
          };
        }
        const postView = missed[postId];

        redis.setex(`Post:${postId}:viewCount`, 365 * 24 * 60 * 60, postView?.count ?? 0);
        return {
          postId,
          count: postView?.count ?? 0,
        };
      });
    },
    key: (row) => row.postId,
  });

  const postView = await loader.load(postId);

  return postView.count;
};

export const defragmentSpaceCollectionPosts = async (tx: Transaction, collectionId: string) => {
  const posts = await tx
    .select({ id: SpaceCollectionPosts.id })
    .from(SpaceCollectionPosts)
    .where(eq(SpaceCollectionPosts.collectionId, collectionId))
    .orderBy(asc(SpaceCollectionPosts.order));

  for (const [order, { id }] of posts.entries()) {
    await tx.update(SpaceCollectionPosts).set({ order }).where(eq(SpaceCollectionPosts.id, id));
  }
};
