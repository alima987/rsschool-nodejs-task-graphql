import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, gqlSchema } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { Context } from 'vm';
import { getLoaders } from './loaders.js';


const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
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

       const errors = validate(gqlSchema, parse(query), [depthLimit(5)]);

      if (errors?.length > 0) {
        return { errors };
      }

      const contextValue: Context = {
        prisma,
        ...getLoaders(prisma),
      };
       return graphql({
          schema: gqlSchema,
          source: query,
          variableValues: variables,
          contextValue,

       });
    },
  });
}; 

export default plugin;
