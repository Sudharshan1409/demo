const { ApolloClient } = require("apollo-client");
const { ApolloLink } = require("apollo-link");
const { InMemoryCache } = require("apollo-cache-inmemory");
const { createHttpLink } = require("apollo-link-http");
const fetch = require("node-fetch");
const PETCHAIN = require("./backend.json")

console.log("Petchain URL:", PETCHAIN.PETCHAIN_URL);
const httpLink = createHttpLink({
    uri: PETCHAIN.PETCHAIN_URL,
    fetch: fetch,
});
const authLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    headers: {
      "x-api-key": PETCHAIN.PETCHAIN_KEY,
    },
  });
  return forward(operation);
});
const graphqlClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
});
module.exports = graphqlClient;