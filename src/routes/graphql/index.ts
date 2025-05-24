import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, parse, GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, validate } from 'graphql';
import { PrismaClient, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library.js';
import { UUIDType } from './types/uuid.js';
import depthLimit from 'graphql-depth-limit';
import { Context } from 'vm';
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
} from './interfaces.js';


const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
  const schema = QLSchema(prisma); 
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
       const { query, variables } = req.body;
       const errors = validate(schema, parse(query), [depthLimit(5)]);

      if (errors?.length > 0) {
        return { errors };
      }

      const contextValue: Context = {
        prisma,
      };
       return graphql({
          schema,
          source: query,
          variableValues: variables,
          contextValue,

       });
    },
  });
}; 
const QLSchema = (prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>): GraphQLSchema => {
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
    fields: {
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
    },
  });
  
  const ChangeUserInputType = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: {
      name: { type: GraphQLString },
      balance: { type: GraphQLFloat },
    },
  });
  
  const CreatePostInputType = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      content: { type: new GraphQLNonNull(GraphQLString) },
      authorId: { type: new GraphQLNonNull(UUIDType) },
    },
  });
  
  const ChangePostInputType = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: {
      title: { type: GraphQLString },
      content: { type: GraphQLString },
    },
  });
  
  const CreateProfileInputType = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: {
      isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    },
  });
  
  const ChangeProfileInputType = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: {
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLInt },
      memberTypeId: { type: MemberTypeIdEnum },
    },
  });
  const MemberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeIdEnum)},
      discount: { type: new GraphQLNonNull(GraphQLFloat)},
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt)}
    })
  })
  const Post: GraphQLObjectType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: UUIDType },
      title: { type: GraphQLString },
      content: { type: GraphQLString },
      authorId: { type: UUIDType },
      author: {
        type: User,
        resolve: async ({ authorId }: Post) =>
          await prismaClient.user.findFirst({ where: { id: authorId } }),
      },
    })
  })

  const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull(UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: {
        type: Profile,
        resolve: async (parent, _, { prisma }) =>
          prisma.profile.findUnique({ where: { userId: parent.id } }),
      },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: async (parent, _, { prisma }) =>
          prisma.post.findMany({ where: { authorId: parent.id } }),
      },
      userSubscribedTo: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async (parent, _, { prisma }) =>
          prisma.user.findMany({
            where: {
              subscribedToUser: {
                some: { id: parent.id },
              },
            },
          }),
      },
      subscribedToUser: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async (parent, _, { prisma }) =>
          prisma.user.findMany({
            where: {
              userSubscribedTo: {
                some: { id: parent.id },
              },
            },
          }),
      },
  }),
});

  const Profile = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberType: {
      type: new GraphQLNonNull(MemberType),
      resolve: async (parent, _, { prisma }) =>
        prisma.memberType.findUnique({ where: { id: parent.memberTypeId } }),
    },
  }),
});
  
  const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
      resolve: async (_, __, { prisma }) => prisma.memberType.findMany(),
    },
    memberType: {
      type: MemberType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }) =>
        prisma.memberType.findUnique({ where: { id } }),
    },
    post: {
      type: Post,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, { id }: { id: string }, { prisma }) =>
        prisma.post.findUnique({ where: { id } }),
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      resolve: async (_, __, { prisma }) => prisma.post.findMany(),
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      resolve: async (_, __, { prisma }) => prisma.user.findMany(),
    },
    user: {
      type: User,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (_, { id }, { prisma }) =>
        prisma.user.findUnique({ where: { id } }),
    },
    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
      resolve: async (_, __, { prisma }) => prisma.profile.findMany(),
    },
    profile: {
      type: Profile,
      args: { id: { type: new GraphQLNonNull(UUIDType) } },
      resolve: async (parent, _, { prisma }) =>
          prisma.profile.findUnique({ where: { userId: parent.id } }),
    },
  }),
});

  const mutationType = new GraphQLObjectType({
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
        type: new GraphQLNonNull(User),
        args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
        resolve: async (_parent, { dto }: CreateUser) =>
          await prismaClient.user.create({ data: dto }),
      },
      createProfile: {
        type: new GraphQLNonNull(Profile),
        args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
        resolve: async (_parent, { dto }: CreateProfile) =>
          await prismaClient.profile.create({ data: dto }),
      },
      createPost: {
        type: new GraphQLNonNull(Post),
        args: { dto: { type: new GraphQLNonNull(CreatePostInputType) } },
        resolve: async (_parent, { dto }: CreatePost) => await prismaClient.post.create({ data: dto }),
      },
      changeUser: {
        type: new GraphQLNonNull(User),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeUserInputType) } },
        resolve: async (_parent, { id, dto }: ChangeUser) =>
          await prismaClient.user.update({ where: { id: id }, data: dto }),
      },
      changeProfile: {
        type: new GraphQLNonNull(Profile),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeProfileInputType) } },
        resolve: async (_parent, { id, dto }: ChangeProfile) =>
          await prismaClient.profile.update({ where: { id }, data: dto }),
      },
      changePost: {
        type: new GraphQLNonNull(Post),
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
      type: new GraphQLNonNull(User),
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, { userId, authorId }: UserSubscribedTo) => {
        await prismaClient.subscribersOnAuthors.create({
          data: { subscriberId: userId, authorId: authorId },
        });

        return await prismaClient.user.findFirst({ where: { id: userId } });
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
  return new GraphQLSchema({
    query: queryType,
    mutation: mutationType,
    types: [UUIDType], 
  });
}

export default plugin;
