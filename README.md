README
------

**Based on a three-part tutorial by Evil Martians**
- https://evilmartians.com/chronicles/graphql-on-rails-1-from-zero-to-the-first-query
- https://evilmartians.com/chronicles/graphql-on-rails-2-updating-the-data
- https://evilmartians.com/chronicles/graphql-on-rails-3-on-the-way-to-perfection

**Using Rails 6.0.0.rc1 (incl ActionCable), GraphQL, Apollo, React 16.3+**

**Extended to include delete functionality**
___

## GraphQL
- avoids over-/underfetching
- strongly-typed schemas
- schema introspection

Why?
Schema = mutation, query, (subscription)
Mutation = typed fields, resolve method?
Types

Fragments
GraphQL's 'variables' -> a named set of fields on a specific type.

## ActionCable

GraphQL Subscription is a mechanism for delivering server-initiated updates to the client. Each update returns the data of a specific type: for instance, we could add a subscription to notify the client when a new item is added.
The Query component from the `react-apollo` library provides the special function `subscribeToMore`:
Read More: https://www.apollographql.com/docs/react/advanced/subscriptions/
---

Notes for self:
` bundle add graphql --version="~> 1.9"`
`rails g graphql:install`

a query represents a sub-graph of the schema
a GraphQL server must guarantee that mutations are executed consecutively, while queries can be executed in parallel.
All variables begin with $
Selection set = {}

 requires QueryType in Types Module, inheriting from Types::BaseObject  `query_type.rb` (mutation and subscription types are optional)

 GraphiQL web interface provided by mounting: (available at http://localhost:3000/graphiql)
 ```ruby
 # config/routes.rb
Rails.application.routes.draw do
  mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql" if Rails.env.development?
  post "/graphql", to: "graphql#execute"
end
```
Requests handled by GraphqlController#execute action (parses query, detects types, resolves requested fields)

Types registered as fields on QueryType and defined via `rails g graphql:object name_of_type`

## Apollo

Read more: https://www.apollographql.com
 - declarative approach to data-fetching
 - single Query component encapsulates all logic for retrieving data/loading/errors/updating UI
 - normalised cache
 > Since you can have multiple paths leading to the same data, normalisation is essential for keeping your data consistent across multiple components
 _https://www.apollographql.com_
 - handles remote AND local data (e.g. global flags, API results) -> `apollo-link-state` for local state-management -> Apollo cache as single source of truth for app's data -> makes GraphQL into unified interface to ALL data (queryable through GraphiQL)

Apollo config in `utils/apollo.js` or `apollo.config.js`

`yarn add apollo-client apollo-cache-inmemory apollo-link-http apollo-link-error apollo-link graphql graphql-tag react-apollo`
(or `yarn add apollo-boost react-apollo graphql` = `apollo-boost` contains the apollo basics!)

### Packages:
- `apollo-client` = perform and cache graphQL requests
- `apollo-cache-inmemory` = storage implementation for Apollo cache (for Apollo Client 2.0) -> `InMemoryCache` as normalised data store (splits data into individual objects w unique identifiers - `id` or `_id` & `__typename`, stored in flattened data structure)
- `apollo-link` = middleware pattern for apollo-client operations
> Apollo Link is a standard interface for modifying control flow of GraphQL requests and fetching GraphQL results. In a few words, Apollo Links are chainable "units" that you can snap together to define how each GraphQL request is handled by your GraphQL client. When you fire a GraphQL request, each Link's functionality is applied one after another. This allows you to control the request lifecycle in a way that makes sense for your application. For example, Links can provide retrying, polling, batching, and more! - From https://www.apollographql.com/docs/link/
- `apollo-link-http` - the most common Apollo link - a terminating link that fetches GraphQL results from a GraphQL endpoint over a http connection (supports auth, persisted queries, dynamic uris etc)
- `apollo-link-error` - callback with `onError` (opts: operation, response, GraphQLErrors, networkError, forward - to next link in chain) https://github.com/apollographql/apollo-link/tree/master/packages/apollo-link-error
- `graphql-tag` = build queries - helpful utilities for parsing GraphQL queries (incl `gqp` - a JavaScript template literal tag that parses GraphQL query strings into the standard GraphlQL AST & `/loader` - a webpack loader to preprocess queries) https://github.com/apollographql/graphql-tag
- `react-apollo` = displaying data (view layer integration for React)

Initialise cache & pass to ApolloClient:

```javascript
// utils/apollo.js
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';

const cache = new InMemoryCache();

const client = new ApolloClient({
  link: new HttpLink(),
  cache
});
```

```javascript
// app/javascript/packs/index.js
import React from "react";
import { render } from "react-dom";
// HOC to wrap children
import { ApolloProvider } from "react-apollo";

const App = () => (
  <ApolloProvider client={client}>
    <div>
      <h2>My first Apollo app 🚀</h2>
    </div>
  </ApolloProvider>
);

render(<App />, document.getElementById("root"));
```

### Apollo Query component
```javascript
<Query></Query>
```
query first tries to load from Apollo cache and if not there, sends request to 'server'
query subscribes to the result = updates reactively
fresh data? via polling/refetching - e.g. startPolling and stopPolling functions on the result object passed to render prop function or refeteech function (e.g. triggered by a button click - no need to pass in vars, uses the ones from the previous query

networkStatus + notifyNetworkStatusChange - info about status of query, useful re: refetch/polling
The networkStatus property is an enum with number values from 1-8 representing a different loading state.
manual queries? e.g. async/await callback on a button click

Example:
```javascript
import gql from "graphql-tag";
import { Query } from "react-apollo";

const GET_DOGS = gql`
  {
    dogs {
      id
      breed
    }
  }
`;

const Dogs = ({ onDogSelected }) => (
  <Query query={GET_DOGS}>
    {({ loading, error, data }) => {
      if (loading) return "Loading...";
      if (error) return `Error! ${error.message}`;

      return (
        <select name="dog" onChange={onDogSelected}>
          {data.dogs.map(dog => (
            <option key={dog.id} value={dog.breed}>
              {dog.breed}
            </option>
          ))}
        </select>
      );
    }}
  </Query>
);
```

---

### Apollo Mutation component
```javascript
<Mutation></Mutation>
```
Apollo Mutation component triggers mutations from UI. To create a Mutation component, just pass a GraphQL mutation string wrapped with the gql function to  this.props.mutation and provide a function to this.props.children that tells React what to render.
 The mutate function optionally takes  variables, optimisticResponse, refetchQueries, and update; however, you can also pass in those values as props to the Mutation component.
 The second argument to the render prop function is an object with your mutation result on the data property, as well as booleans for loading and if the mutate function was called, in addition to  error. If you'd like to ignore the result of the mutation, pass ignoreResults as a prop to the mutation component.
The update function is called with the Apollo cache as the first argument. The cache has several utility functions such as cache.readQuery and cache.writeQuery that allow you to read and write queries to the cache with GraphQL as if it were a server.
The second argument to the update function is an object with a data property containing your mutation result. If you specify an optimistic response, your update function will be called twice: once with your optimistic result, and another time with your actual result. You can use your mutation result to update the cache with cache.writeQuery.
Wait for the mutation to be completed and update the cache manually => `apollo-cache-inmemory`'s `writeQuery`. The Mutation component from the react-apollo library has a special property called update. It accepts cache as the first argument and the mutation result as the second. We want to manually add a new cache entry using a writeQuery method. It’s like saying “Hey, Apollo! Here is some data, pretend that you received it from the server.”

Example:
```javascript
const GET_TODOS = gql`
  query GetTodos {
    todos
  }
`;

const AddTodo = () => {
  let input;

  return (
    <Mutation
      mutation={ADD_TODO}
      update={(cache, { data: { addTodo } }) => {
        const { todos } = cache.readQuery({ query: GET_TODOS });
        cache.writeQuery({
          query: GET_TODOS,
          data: { todos: todos.concat([addTodo]) },
        });
      }}
    >
      {addTodo => (
        <div>
          <form
            onSubmit={e => {
              e.preventDefault();
              addTodo({ variables: { type: input.value } });
              input.value = "";
            }}
          >
            <input
              ref={node => {
                input = node;
              }}
            />
            <button type="submit">Add Todo</button>
          </form>
        </div>
      )}
    </Mutation>
  );
};
```
Not every mutation requires an update function. If you're updating a single item, you usually don't need an update function as long as you return the item's id and the property you updated. While this may seem like magic, this is actually a benefit of Apollo's normalized cache, which splits out each object with an id into its own entity in the cache.
In the render prop function, we can destructure loading and error properties off the mutation result in order to track the state of our mutation in our UI. The Mutation component also has onCompleted and onError props in case you would like to provide callbacks instead. Additionally, the mutation result object also has a called boolean that tracks whether or not the mutate function has been called.

When fetching an item list, the response was normalized and each item was added to the cache. apollo generates a key ${object__typename}:${objectId} for each entity that has __typename and id. When the mutation is completed, we get the object with the same __typename and id, apollo finds it in cache and makes changes (components are re-rendered too).
---

### React Component Folders:
- javascript/components/Name/
-- index.js
-- operations.graphql
-- styles.module.css

### RSpec setup:
```bash
bundle add rspec-rails --version="4.0.0.beta2" --group="development,test"
rails generate rspec:install
bundle add factory_bot_rails --version="~> 5.0" --group="development,test"
```

add `config.include FactoryBot::Syntax::Methods` to `rails_helper.rb`

```ruby
# spec/factories.rb
FactoryBot.define do
  factory :user do
    # Use sequence to make sure that the value is unique
    sequence(:email) { |n| "user-#{n}@example.com" }
  end

  factory :item do
    sequence(:title) { |n| "item-#{n}" }
    user
  end
end

# spec/graphql/types/query_type_spec.rb
require "rails_helper"

RSpec.describe Types::QueryType do
  describe "items" do
    let!(:items) { create_pair(:item) }

    let(:query) do
      %(query {
        items {
          title
        }
      })
    end

    subject(:result) do
      MartianLibrarySchema.execute(query).as_json
    end

    it "returns all items" do
      expect(result.dig("data", "items")).to match_array(
        items.map { |item| { "title" => item.title } }
      )
    end
  end
end
```