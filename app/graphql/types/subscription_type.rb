module Types
  class SubscriptionType < GraphQL::Schema::Object
    field :item_added, Types::ItemType, null: false, description: "An item was added"
    field :item_updated, Types::ItemType, null: false, description: "Existing item was updated"
    field :item_deleted, Types::ItemType, null: false, description: "Item was deleted"
    def item_added; end
    def item_updated; end
    def item_deleted; end
  end
end