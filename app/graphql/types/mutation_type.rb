# register mutations from /mutations here
module Types
  class MutationType < Types::BaseObject
    field :sign_in, mutation: Mutations::SignInMutation
    field :add_item, mutation: Mutations::AddItemMutation
    field :update_item, mutation: Mutations::UpdateItemMutation
    field :delete_item, mutation: Mutations::DeleteItemMutation
  end
end
