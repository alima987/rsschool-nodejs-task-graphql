import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { PrismaClient, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library.js';
import { UUIDType } from './types/uuid.js';

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
       return graphql({
          schema,
          source: req.body.query,
          variableValues: req.body.variables,
       });
    },
  });
}; 

const QLSchema = (prisma: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>): GraphQLSchema => {
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
      yearOfBirth: { type: new GraphQLNonNull(GraphQLFloat) },
      userId: { type: new GraphQLNonNull(UUIDType) },
      memberTypeId: { type: new GraphQLNonNull(MemberTypeIdEnum) },
    },
  });
  
  const ChangeProfileInputType = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: {
      isMale: { type: GraphQLBoolean },
      yearOfBirth: { type: GraphQLFloat },
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
  const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      id: { type: new GraphQLNonNull( UUIDType)},
      title: { type: new GraphQLNonNull(GraphQLString)},
      content: { type: new GraphQLNonNull(GraphQLString)}
    })
  })
  const Profile = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
      id: { type: new GraphQLNonNull( UUIDType) },
      isMale: { type: new GraphQLNonNull(GraphQLString) },
      yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
      memberType: { type: new GraphQLNonNull(MemberType) },
    })
  });

  const User = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
      id: { type: new GraphQLNonNull( UUIDType) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      balance: { type: new GraphQLNonNull(GraphQLFloat) },
      profile: { type: Profile },
      posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))) },
      userSubscribedTo: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))) },
      subscribedToUser: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))) },
    })
  });
  const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      memberTypes: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberType))),
        resolve: async () => prisma.memberType.findMany()
      },
      memberType: {
        type: MemberType,
        args: {
          id: { type: new GraphQLNonNull(MemberTypeIdEnum)}
        },
        resolve: async (_: unknown, args: { id: string }) => prisma.memberType.findUnique({ where: { id: args.id } })
      },
      post: {
        type: Post,
        args: {
          id: { type: new GraphQLNonNull( UUIDType) }
        },
        resolve: async (_: unknown, { id }: { id: string }) => {
          return prisma.post.findUnique({ where: { id } });
        }
        },
      posts: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
        resolve: async () => prisma.post.findMany()
      },
      }),
      user: {
        type: User,
        args: {
          id: { type: new GraphQLNonNull(UUIDType) }
        },
        resolve: (_: unknown, args: { id: string }) =>
          prisma.user.findUnique({ where: { id: args.id } }),
      },
      users: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
        resolve: async() => prisma.user.findMany()
      },
      profiles: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Profile))),
        resolve: async() => prisma.profile.findMany()
      },
      profile: {
        type: Profile,
        args: {
          id: { type: new GraphQLNonNull( UUIDType) }
        },
        resolve: (_: unknown, args: { id: string }) => prisma.profile.findUnique({ where: { id: args.id } })
      }
  })
  const mutationType = new GraphQLObjectType({
     name: 'Mutations',
     fields: () => ({
      deleteUser: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          id: { type: new GraphQLNonNull( UUIDType)}
        },
        resolve: async (_: unknown, args: { id: string }) => {
          await prisma.user.delete({ where: { id: args.id } });
          return 'User deleted';
        }
       },
      createUser: {
        type: new GraphQLNonNull(User),
        args: { dto: { type: new GraphQLNonNull(CreateUserInputType) } },
        resolve: (_, { dto }, { prisma }) => prisma.user.create({ data: dto })
      },
      createProfile: {
        type: new GraphQLNonNull(Profile),
        args: { dto: { type: new GraphQLNonNull(CreateProfileInputType) } },
        resolve: (_, { dto }, { prisma }) => prisma.profile.create({ data: dto })
      },
      createPost: {
        type: new GraphQLNonNull(Post),
        args: { dto: { type: new GraphQLNonNull(CreatePostInputType) } },
        resolve: (_, { dto }, { prisma }) => prisma.post.create({ data: dto })
      },
      changeUser: {
        type: new GraphQLNonNull(User),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeUserInputType) } },
        resolve: (_, { id, dto }, { prisma }) => prisma.user.update({ where: { id }, data: dto })
      },
      changeProfile: {
        type: new GraphQLNonNull(Profile),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangeProfileInputType) } },
        resolve: (_, { id, dto }, { prisma }) => prisma.profile.update({ where: { id }, data: dto })
      },
      changePost: {
        type: new GraphQLNonNull(Post),
        args: { id: { type: new GraphQLNonNull( UUIDType) }, dto: { type: new GraphQLNonNull(ChangePostInputType) } },
        resolve: (_, { id, dto }, { prisma }) => prisma.post.update({ where: { id }, data: dto })
      },
      deletePost: {
        type: new GraphQLNonNull(GraphQLString),
        args: { id: { type: new GraphQLNonNull( UUIDType) } },
        resolve: async (_, { id }, { prisma }) => {
          await prisma.post.delete({ where: { id } });
          return 'deleted';
        }
      },
      deleteProfile: {
        type: new GraphQLNonNull(GraphQLString),
        args: { id: { type: new GraphQLNonNull( UUIDType) } },
        resolve: async (_, { id }, { prisma }) => {
          await prisma.profile.delete({ where: { id } });
          return 'deleted';
        }
      },
      subscribeTo: {
        type: new GraphQLNonNull(GraphQLString),
        args: { userId: { type: new GraphQLNonNull( UUIDType) }, authorId: { type: new GraphQLNonNull( UUIDType) } },
        resolve: async (_, { userId, authorId }, { prisma }) => {
          await prisma.user.update({ where: { id: userId }, data: { userSubscribedTo: { connect: { id: authorId } } } });
          return 'subscribed';
        }
    },
    unsubscribeFrom: {
      type: new GraphQLNonNull(GraphQLString),
      args: { userId: { type: new GraphQLNonNull( UUIDType) }, authorId: { type: new GraphQLNonNull( UUIDType) } },
      resolve: async (_, { userId, authorId }, { prisma }) => {
        await prisma.user.update({ where: { id: userId }, data: { userSubscribedTo: { disconnect: { id: authorId } } } });
        return 'unsubscribed';
      }
    }
     })
  })
  return new GraphQLSchema({
    query: queryType,
    mutation: mutationType,
    types: [UUIDType], 
  });
}

export default plugin;
