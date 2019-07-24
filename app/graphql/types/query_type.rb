module Types
  class QueryType < Types::BaseObject
    # Add root-level fields here.
    # They will be entry points for queries on your schema.

    field :items,
          [Types::ItemType],
          null: false,
          description: "Returns a list of items in the martian library" # optional description for doc

    field :me, Types::UserType, null: true

    def items
      #  eager loading to avoid n+1 (or use graphql-batch/ar_lazy_preload gems)
      Item.preload(:user)
    end

    def me
      context[:current_user]
    end
  end
end
