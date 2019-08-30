import React from 'react';
import { Mutation } from 'react-apollo';
import { DeleteItemMutation } from './operations.graphql';
import { LibraryQuery } from '../Library/operations.graphql';

const DeleteItemForm = ({id}) => {
  console.log('id', id)
  console.log('mutation', DeleteItemMutation)
  const destroy = (id, deleteItem) => {
    console.log('hello')
    deleteItem({
      variables: {
        id: id
      },
      update: (cache, { data: { deleteItem } } ) => {
        const item = deleteItem.item;
        console.log('item', deleteItem)
        const currentItems = cache.readQuery(
          { query: LibraryQuery }
        );
        console.log('currentItems', currentItems)
        const filteredItems = currentItems.items.filter(i => i.id !== item.id)
        cache.writeQuery({
          query: LibraryQuery,
          data: {
            items: filteredItems
          },
        });
      }
    })
  }
  return (
  <Mutation mutation={DeleteItemMutation}>
    {(deleteItem, { loading, data }) => (
      <button
        onClick={() => {
          console.log(data)
          destroy(id, deleteItem)
        }}>Delete</button>
    )}
  </Mutation>
  )
}

export default DeleteItemForm;