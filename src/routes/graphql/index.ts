import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { PrismaClient, Prisma } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library.js';

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
  const MemberType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
      id: { type: new GraphQLNonNull(MemberTypeIdEnum)},
      discount: { type: new GraphQLNonNull(GraphQLFloat)},
      postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt)}
    })
  })
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
        resolve: async (_, id) => prisma.memberType.findUnique({ where: { id } })
      }
    })
  })
  return new GraphQLSchema({
    query: queryType,
    //mutation: 
  });
}

export default plugin;
