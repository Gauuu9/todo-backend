import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setContext } from '@apollo/client/link/context';

const GRAPHQL_ENDPOINT = 'http://192.168.0.156:3000/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('userToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export const setGraphQLEndpoint = (ip: string) => {
  return new ApolloClient({
    link: authLink.concat(
      createHttpLink({
        uri: `http://${ip}:3000/graphql`,
      }),
    ),
    cache: new InMemoryCache(),
  });
};
