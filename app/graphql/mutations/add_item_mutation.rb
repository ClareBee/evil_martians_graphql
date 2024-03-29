module Mutations
  class AddItemMutation < Mutations::BaseMutation
    argument :attributes, Types::ItemAttributes, required: true

    field :item, Types::ItemType, null: true
    field :errors, Types::ValidationErrorsType, null: true

    def resolve(attributes:)
      check_authentication!

      item = Item.new(
        attributes.to_h.merge(user: context[:current_user])
      )

      if item.save
        MartianLibrarySchema.subscriptions.trigger("itemAdded", {}, item) # field name, options, root object of subscription update
        { item: item }
      else
        { errors: item.errors }
      end
    end
  end
end