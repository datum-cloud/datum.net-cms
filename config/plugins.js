module.exports = ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      depthLimit: 7,
      amountLimit: 50,
      landingPage:false,
      apolloServer: {
        introspection: false,
        tracing: false,
      },
    },
  },
  upload: {
    config: {
      hashFileName: false,
    },
  },
});