module.exports = ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        introspection: true,
      },
    },
  },
  upload: {
    config: {
      hashFileName: false,
    },
  },
});