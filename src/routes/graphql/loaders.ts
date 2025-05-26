import DataLoader from 'dataloader';
import { Static } from '@sinclair/typebox';
import { profileSchema } from '../profiles/schemas.js';
import { postSchema } from '../posts/schemas.js';
import { userSchema } from '../users/schemas.js';
import { memberTypeSchema } from '../member-types/schemas.js';
import { MemberType, PrismaClient } from '@prisma/client';

export type ProfileBody = Static<typeof profileSchema>;
export type PostBody = Static<typeof postSchema>;
export type UserBody = Static<typeof userSchema>;
export type MemberTypeBody = Static<typeof memberTypeSchema>;

export const getLoaders = (prisma: PrismaClient) => {
  return {
    profileLoader: new DataLoader<string, ProfileBody>(
      async (userIds: readonly string[]) => {
        const relatedProfiles = await prisma.profile.findMany({
          where: {
            userId: {
              in: [...userIds],
            },
          },
        });

        const profileMap: Record<string, ProfileBody> = {};
        relatedProfiles.forEach((p) => {
          profileMap[p.userId] = p;
        });

        return userIds.map((key: string) => profileMap[key] ?? null);
      },
    ),
    postsLoader: new DataLoader<string, PostBody[]>(
      async (userIds: readonly string[]) => {
        const relatedPosts = await prisma.post.findMany({
          where: {
            authorId: {
              in: [...userIds],
            },
          },
        });

        const postMap: Record<string, PostBody[]> = {};
        relatedPosts.forEach((p) => {
          postMap[p.authorId] ? postMap[p.authorId].push(p) : (postMap[p.authorId] = [p]);
        });

        return userIds.map((key: string) => postMap[key] ?? []);
      },
    ),
    memberTypeLoader: new DataLoader<string, MemberType>(
      async (memberTypeIds: readonly string[]) => {
        const relatedMember = await prisma.memberType.findMany({
          where: {
            profiles: {
              some: {
                memberTypeId: {
                  in: [...memberTypeIds],
                },
              },
            },
          },
        });

        const memberMap: Record<string, MemberType> = {};
        relatedMember.forEach((m) => {
          memberMap[m.id] = m;
        });

        return memberTypeIds.map((key: string) => memberMap[key] ?? null);
      },
    ),
    subscrideToUserLoader: new DataLoader<string, UserBody[]>(
      async (authorIds: readonly string[]) => {
        const relatedUsers = await prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: {
                  in: [...authorIds],
                },
              },
            },
          },
          include: {
            userSubscribedTo: true,
          },
        });

        return authorIds.map((authorId) => {
          return relatedUsers.filter((user) =>
            user.userSubscribedTo.some((sub) => sub.authorId === authorId),
          );
        });
      },
    ),
    userSubscrideToLoader: new DataLoader<string, UserBody[]>(
      async (subscriberIds: readonly string[]) => {
        const relatedUsers = await prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: {
                  in: [...subscriberIds],
                },
              },
            },
          },
          include: {
            subscribedToUser: true,
          },
        });

        return subscriberIds.map((subscriberId) => {
          return relatedUsers.filter((user) =>
            user.subscribedToUser.some((sub) => sub.subscriberId === subscriberId),
          );
        });
      },
    ),
  };
};