# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

bundle add graphql --version="~> 1.9"
rails generate graphql:install

docker-compose build
docker-compose up
docker-compose run web rake db:create
docker-compose down
docker-compose run web bundle install

Notes for self:
` bundle add graphql --version="~> 1.9"`
`rails g graphql:install`
GraphQL - avoid overfetching, strongly typed schemas, schema introspection
a query represents a sub-graph of the schema
 a GraphQL server must guarantee that mutations are executed consecutively, while queries can be executed in parallel.
All variables begin with $
Selection set = {} 
 ---
 requires QueryType in Types Module, inheriting from Types::BaseObject  `query_type.rb` (mutation and subscription types are optional)
 GraphiQL web interface provided by mounting: (available at http://localhost:3000/graphiql)
 ```ruby
 # config/routes.rb
Rails.application.routes.draw do
  mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql" if Rails.env.development?
  post "/graphql", to: "graphql#execute"
end
```
requests handled by GraphqlController#execute action (parses query, detects types, resolves requested fields)

Types registered as fields on QueryType and defined via `rails g graphql:object name_of_type`

Apollo for client-side
yarn add apollo-client apollo-cache-inmemory apollo-link-http apollo-link-error apollo-link graphql graphql-tag react-apollo
graphql-tag = build queries
apollo-client = perform and cache graphQL requests
apollo-cache-inmemory = storage implementation for Apollo cache
react-apollo = displaying data
apollo-link = middleware pattern for apollo-client operations
Apollo config in utils/apollo.js
ApolloProvider HOC to wrap children

RSpec
bundle add rspec-rails --version="4.0.0.beta2" --group="development,test"
rails generate rspec:install
bundle add factory_bot_rails --version="~> 5.0" --group="development,test"
add config.include FactoryBot::Syntax::Methods to rails_helper.rb
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

Add a class implementing the mutation logic, which includes:
the input type definition (arguments);
the return type definition;
the #resolve method.
Add a new entry to MutationType.
--
Wait for the mutation to be completed and update the cache manually. apollo-cache-inmemory provides writeQuery function for that. The Mutation component from the react-apollo library has a special property called update. It accepts cache as the first argument and the mutation result as the second. We want to manually add a new cache entry using a writeQuery method. It’s like saying “Hey, Apollo! Here is some data, pretend that you received it from the server.”

Apollo Query component provides loading, error and data properties:

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
Apollo Query component requries query/children
query first tries to load from Apollo cache and if not there, sends request to 'server'
query subscribes to the result = updates reactively
fresh data? via polling/refetching - e.g. startPolling and stopPolling functions on the result object passed to render prop function or refeteech function (e.g. triggered by a button click - no need to pass in vars, uses the ones from the previous query

networkStatus + notifyNetworkStatusChange - info about status of query, useful re: refetch/polling
The networkStatus property is an enum with number values from 1-8 representing a different loading state.
manual queries? e.g. async/await callback on a button click

Apollo Mutation component is what you'll use to trigger mutations from your UI. To create a Mutation component, just pass a GraphQL mutation string wrapped with the gql function to  this.props.mutation and provide a function to this.props.children that tells React what to render.
 The mutate function optionally takes  variables, optimisticResponse, refetchQueries, and update; however, you can also pass in those values as props to the Mutation component.
 The second argument to the render prop function is an object with your mutation result on the data property, as well as booleans for loading and if the mutate function was called, in addition to  error. If you'd like to ignore the result of the mutation, pass ignoreResults as a prop to the mutation component.
The update function is called with the Apollo cache as the first argument. The cache has several utility functions such as cache.readQuery and cache.writeQuery that allow you to read and write queries to the cache with GraphQL as if it were a server.
The second argument to the update function is an object with a data property containing your mutation result. If you specify an optimistic response, your update function will be called twice: once with your optimistic result, and another time with your actual result. You can use your mutation result to update the cache with cache.writeQuery.
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

Not every mutation requires an update function. If you're updating a single item, you usually don't need an update function as long as you return the item's id and the property you updated. While this may seem like magic, this is actually a benefit of Apollo's normalized cache, which splits out each object with an id into its own entity in the cache.
In the render prop function, we can destructure loading and error properties off the mutation result in order to track the state of our mutation in our UI. The Mutation component also has onCompleted and onError props in case you would like to provide callbacks instead. Additionally, the mutation result object also has a called boolean that tracks whether or not the mutate function has been called.

When fetching an item list, the response was normalized and each item was added to the cache. apollo generates a key ${object__typename}:${objectId} for each entity that has __typename and id. When the mutation is completed, we get the object with the same __typename and id, apollo finds it in cache and makes changes (components are re-rendered too).
---
GraphQL has its own “variables” called fragments. A fragment is a named set of fields on a specific type.