import React from 'react';
import { Mutation } from 'react-apollo';
import { DeleteItemMutation } from './operations.graphql';
import { LibraryQuery } from '../Library/operations.graphql';
import cs from './styles';


const DeleteItemForm = ({id}) => {
  const destroy = (id, deleteItem) => {
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
    {(deleteItem) =>
      <button
        className={cs.delete}
        onClick={() => {
          destroy(id, deleteItem)
        }}>
          Delete
      </button>
    }
  </Mutation>
  )
}

export default DeleteItemForm;