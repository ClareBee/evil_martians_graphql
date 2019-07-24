import React from 'react';
import { Mutation } from 'react-apollo';
import { AddItemMutation } from './operations.graphql';
import ProcessItemForm from '../ProcessItemForm';

const AddItemForm = () => (
  <Mutation mutation={AddItemMutation}>
    {(addItem, {loading}) => (
      <ProcessItemForm
        buttonText="Add Item"
        loading={loading}
        onProcessItem={({ title, description, imageUrl }) =>
          addItem({
            variables: {
              title,
              description,
              imageUrl
            }
          })
        }
      />
    )}
  </Mutation>
);

export default AddItemForm;