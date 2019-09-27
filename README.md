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

Fragments
GraphQL's 'variables' -> a named set of fields on a specific type.

---

### Notes for self:
` bundle add graphql --version="~> 1.9"`
`rails g graphql:install`

- A query represents a sub-graph of the schema
- GraphQL server must guarantee that mutations are executed consecutively, while queries can be executed in parallel.
- All variables begin with $
Selection set = {}
- Requires QueryType in Types Module, inheriting from Types::BaseObject  `query_type.rb` (mutation & subscription types are optional)
- Requests handled by `GraphqlController#execute` action (parses query, detects types, resolves requested fields)
- Types registered as fields on QueryType & defined via `rails g graphql:object name_of_type`

---

 **GraphiQL** web interface provided by mounting: (available at http://localhost:3000/graphiql)
 ```ruby
 # config/routes.rb
Rails.application.routes.draw do
  mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql" if Rails.env.development?
  post "/graphql", to: "graphql#execute"
end
```
![GraphiQL](GraphiQL.PNG)

---

## Apollo

Read more: https://www.apollographql.com
 - declarative approach to data-fetching
 - single Query component encapsulates all logic for retrieving data/loading/errors/updating UI
 - normalised cache
 > Since you can have multiple paths leading to the same data, normalisation is essential for keeping your data consistent across multiple components
 _https://www.apollographql.com_
 - handles remote AND local data (e.g. global flags, API results) -> `apollo-link-state` for local state-management -> Apollo cache as single source of truth for app's data -> makes GraphQL into unified interface to ALL data (queryable through GraphiQL)

Apollo config in `utils/apollo.js` or `apollo.config.js`

### Installation:
`yarn add apollo-client apollo-cache-inmemory apollo-link-http apollo-link-error apollo-link graphql graphql-tag react-apollo`
(or `yarn add apollo-boost react-apollo graphql` = `apollo-boost` contains the apollo basics!)

### Packages:
- `apollo-client` = perform & cache graphQL requests
- `apollo-cache-inmemory` = storage implementation for Apollo cache (for Apollo Client 2.0) -> `InMemoryCache` as normalised data store (splits data into individual objects w unique identifiers - `id` or `_id` & `__typename`, stored in flattened data structure)
- `apollo-link` = middleware pattern for apollo-client operations
> Apollo Link is a standard interface for modifying control flow of GraphQL requests and fetching GraphQL results. In a few words, Apollo Links are chainable "units" that you can snap together to define how each GraphQL request is handled by your GraphQL client. When you fire a GraphQL request, each Link's functionality is applied one after another. This allows you to control the request lifecycle in a way that makes sense for your application. For example, Links can provide retrying, polling, batching, and more! - From https://www.apollographql.com/docs/link/
- `apollo-link-http` - the most common Apollo link - a terminating link that fetches GraphQL results from a GraphQL endpoint over a http connection (supports auth, persisted queries, dynamic uris etc)
- `apollo-link-error` - callback with `onError` (opts: operation, response, GraphQLErrors, networkError, forward - to next link in chain) https://github.com/apollographql/apollo-link/tree/master/packages/apollo-link-error
- `graphql-tag` = build queries - helpful utilities for parsing GraphQL queries (incl `gqp` - a JavaScript template literal tag that parses GraphQL query strings into the standard GraphlQL AST & `/loader` - a webpack loader to preprocess queries) https://github.com/apollographql/graphql-tag
- `react-apollo` = displaying data (view layer integration for React)

#### Initialise cache & pass to ApolloClient:

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

### Wrap App in Provider HOC

```javascript
// app/javascript/packs/index.js
import React from "react";
import { render } from "react-dom";
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
- Query first tries to load from Apollo cache and if not there, sends request to 'server'
- Query subscribes to the result = updates reactively
 -Fresh data? via polling/refetching - e.g. `startPolling` and `stopPolling` functions on the result object passed to render prop function or refetch function (e.g. triggered by a button click - no need to pass in vars, uses the ones from the previous query

`networkStatus` + `notifyNetworkStatusChange` - info about status of query, useful re: refetch/polling
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
See [Apollo Docs](https://deploy-preview-4650--apollo-client-docs.netlify.com/docs/react/essentials/mutations) for 
- Triggers mutations from UI. 
- Opt params = `variables`, `optimisticResponse`, `refetchQueries`, & `update` (OR can be passed into the Mutation component as props)

```
const GET_TODOS = gql`
  query GetTodos {
    todos
  }
`;

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
    [...]
  ```

**Update function**:
- Apollo cache as 1st argument, mutation result as second (on data property)
- Pass `ignoreResults` as a prop to disregard result.
- `cache.readQuery` & `cache.writeQuery` allow you to read & write queries to the cache w GraphQL as if it were a server.
- `optimisticResponse` = update function will be called twice: once with optimistic result, & again with actual result.
- track state of mutation in UI w `loading`/`error`/`called` booleans.

Example: (from Apollo docs)
```
const Todos = () => (
  <Query query={GET_TODOS}>
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      return data.todos.map(({ id, type }) => {
        let input;

        return (
          <Mutation mutation={UPDATE_TODO} key={id}>
            {(updateTodo, { loading, error }) => (
              <div>
                <p>{type}</p>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    updateTodo({ variables: { id, type: input.value } });

                    input.value = "";
                  }}
                >
                  <input
                    ref={node => {
                      input = node;
                    }}
                  />
                  <button type="submit">Update Todo</button>
                </form>
                {loading && <p>Loading...</p>}
                {error && <p>Error :( Please try again</p>}
              </div>
            )}
          </Mutation>
        );
      });
    }}
  </Query>
 ```

- Apollo generates a key `${object__typename}:${objectId}` for each entity that has `__typename` and `id` => finds it after mutation & makes changes/rerenders components. i.e. if only updating a single entity, no need for update!

From: [Apollo Docs](https://deploy-preview-4650--apollo-client-docs.netlify.com/docs/react/essentials/mutations)

---
**Subscriptions**
GraphQL Subscription = delivers server-initiated updates to the client. Each update returns the data of a specific type: e.g. notify that new item has been added
The Query component from the `react-apollo` library provides the special function `subscribeToMore`
Read More: https://www.apollographql.com/docs/react/advanced/subscriptions/

Used with ActionCable, allows 'realtime' data refresh.

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

Add `config.include FactoryBot::Syntax::Methods` to `rails_helper.rb`

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
