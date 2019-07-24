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