import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql';
import { PrismaClient } from '@prisma/client';
import { UUIDType } from './types/uuid.js';
import {
  ChangePost,
  ChangeProfile,
  ChangeUser,
  CreatePost,
  CreateProfile,
  CreateUser,
  Post,
  Profile,
  User,
  UserSubscribedTo,
  Member
} from './interfaces.js';

const prismaClient: PrismaClient = new PrismaClient();

  const MemberTypeIdEnum = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      BASIC: { value: 'BASIC' },
      BUSINESS: { value: 'BUSINESS'}
    }
  })
  const CreateUserInputType = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: () => ({
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
    }),
  });
  
  const ChangeUserInputType = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: () => ({
      name: { type: GraphQLString },
      balance: { type: GraphQLFloat },
    }),
  });
  
  const CreatePostInputType = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: () => ({
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      authorId: { type: new GraphQLNonNull(UUIDType) },
    }),
  });
  
  export const ChangePostInputType = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: () => ({
      authorId: { type: UUIDType },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
    }),
  });
  
  const CreateProfileInputType = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: () => ({
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    }),
  });
  
  const ChangeProfileInputType = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: () => ({
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: MemberTypeIdEnum },
    }),
  });
  const MemberType: GraphQLObjectType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeIdEnum)},
      discount: { type: new GraphQLNonNull(GraphQLFloat)},
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt)},
      profiles: {
      type: new GraphQLNonNull(new GraphQLList(ProfileType)),
      resolve: async ({ id }: Member) => {
        await prismaClient.profile.findMany({ where: { memberTypeId: id } });
      },
    },
    })
  })
  const PostType: GraphQLObjectType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: UUIDType },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      authorId: { type: UUIDType },
      author: {
        type: UserType,
        resolve: async ({ authorId }: Post) =>
          await prismaClient.user.findFirst({ where: { id: authorId } }),
      },
    })
  })

  const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: ProfileType,
      resolve: async ({ id }: User) =>
        await prismaClient.profile.findFirst({ where: { userId: id } }),
    },

    posts: {
      type: new GraphQLList(PostType),
      resolve: async ({ id }: User) =>
        await prismaClient.post.findMany({ where: { authorId: id } }),
    },

    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
      resolve: async ({ id }: User) => {
        const results = await prismaClient.subscribersOnAuthors.findMany({
          where: { subscriberId: id },
          select: { author: true },
        });

        return results.map((result) => result.author);
      },
    },

    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
      resolve: async ({ id }: User) => {
        const results = await prismaClient.subscribersOnAuthors.findMany({
          where: { authorId: id },
          select: { subscriber: true },
        });
        return results.map((result) => result.subscriber);
      },
    },
  }),
});

  const ProfileType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: UUIDType },
    user: {
      type: UserType,
      resolve: async ({ userId }: Profile) =>
        prismaClient.user.findFirst({ where: { id: userId } }),
    },
    memberTypeId: { type: MemberTypeIdEnum  },
    memberType: {
      type: MemberType,
      resolve: async ({ memberTypeId }: Profile) =>
        await prismaClient.memberType.findFirst({ where: { id: memberTypeId } }),
    },
  }),
});

  
  export const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLList(MemberType),
      resolve: async () => await prismaClient.memberType.findMany()
    },
    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
      },
       resolve: async (_parent, { id }: Member) =>
        await prismaClient.memberType.findFirst({ where: { id } })
    },
    post: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
     resolve: async (_parent, { id }: Post) =>
        await prismaClient.post.findFirst({ where: { id } }),
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async () => await prismaClient.user.findMany(),
    },
    users: {
       type: new GraphQLList(UserType),
       resolve: async () => await prismaClient.user.findMany(),
    },
    user: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_parent, { id }: User) =>
        await prismaClient.user.findFirst({ where: { id } }),
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      resolve: async () => await prismaClient.profile.findMany({}),
    },
    profile: {
      type: ProfileType,
      args: { id: { type: UUIDType } },
      resolve: async (_parent, { id }: Profile) =>
        await prismaClient.profile.findFirst({ where: { id } }),
    },
  }),
});

  export const mutationType = new GraphQLObjectType({
     name: 'Mutations',
     fields: () => ({
      deleteUser: {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: {
          id: { type: new GraphQLNonNull( UUIDType)}
        },
        resolve: async (_parent, { id }: User) => {
        try {
          await prismaClient.user.delete({ where: { id: id } });
        } catch (err) {
          return false;
        }

        return true;
      },
       },
      createUser: {
        type: new GraphQLNonNull(UserType),
        args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
        resolve: async (_parent, { dto }: CreateUser) =>
          await prismaClient.user.create({ data: dto }),
      },
      createProfile: {
        type: new GraphQLNonNull(ProfileType),
        args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
        resolve: async (_parent, { dto }: CreateProfile) =>
          await prismaClient.profile.create({ data: dto }),
      },
      createPost: {
        type: new GraphQLNonNull(PostType),
        args: { dto: { type: new GraphQLNonNull(CreatePostInputType) } },
        resolve: async (_parent, { dto }: CreatePost) => await prismaClient.post.create({ data: dto }),
      },
      changeUser: {
        type: new GraphQLNonNull(UserType),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeUserInputType) } },
        resolve: async (_parent, { id, dto }: ChangeUser) =>
          await prismaClient.user.update({ where: { id: id }, data: dto }),
      },
      changeProfile: {
        type: new GraphQLNonNull(ProfileType),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeProfileInputType) } },
        resolve: async (_parent, { id, dto }: ChangeProfile) =>
          await prismaClient.profile.update({ where: { id }, data: dto }),
      },
      changePost: {
        type: new GraphQLNonNull(PostType),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangePostInputType) } },
        resolve: async (_parent, { id, dto }: ChangePost) => await prismaClient.post.update({ where: { id }, data: dto }),
      },
      deletePost: {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: { id: { type: new GraphQLNonNull( UUIDType) } },
        resolve: async (_parent, { id }: Post) => {
        try {
          await prismaClient.post.delete({ where: { id } });
        } catch (err) {
          return false;
        }

        return true;
      },

      },
      deleteProfile: {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: { id: { type: new GraphQLNonNull( UUIDType) } },
        resolve: async (_parent, { id }: Profile) => {
        try {
          await prismaClient.profile.delete({ where: { id } });
        } catch (err) {
          return false;
        }

        return true;
      },

      },
      subscribeTo: { 
      type: new GraphQLNonNull(GraphQLString),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { userId, authorId }: UserSubscribedTo) => {
        await prismaClient.subscribersOnAuthors.create({
          data: { subscriberId: userId, authorId: authorId },
        });

        return 'Subscription created successfully';
      },
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { userId, authorId }: UserSubscribedTo) => {
        try {
          await prismaClient.subscribersOnAuthors.deleteMany({
            where: { subscriberId: userId, authorId: authorId },
          });
        } catch {
          return false;
        }

        return true;
      },
    },
  })
  })