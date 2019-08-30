module Mutations
  class DeleteItemMutation < Mutations::BaseMutation
    argument :id, ID, required: true

    field :item, Types::ItemType, null: true
    field :errors, Types::ValidationErrorsType, null: true

    def resolve(id:)
      check_authentication!
      item = Item.find(id)
      if item.delete
        MartianLibrarySchema.subscriptions.trigger("itemDeleted", {}, item)
        { item: item }
      else
        { errors: item.errors }
      end
    end
  end
end