import React from 'react';
import { Mutation } from 'react-apollo';
import { UpdateItemMutation } from './operations.graphql';
import ProcessItemForm from '../ProcessItemForm';
import cs from './styles';

const UpdateItemForm = ({
  id,
  initialTitle,
  initialDescription,
  initialImageUrl,
  onClose,
  onErrors,
  errors
}) => {
  console.log('errors in update form', errors)
  return (
    <div className={cs.overlay}>
      <div className={cs.content}>
        <Mutation mutation={UpdateItemMutation} errorPolicy="none">
          {(updateItem, { loading, data }) => (
            <ProcessItemForm
              initialImageUrl={initialImageUrl}
              initialTitle={initialTitle}
              initialDescription={initialDescription}
              buttonText="Update Item"
              loading={loading}
              data={data}
              errors={errors}
              onProcessItem={({ title, description, imageUrl }) => {
                updateItem({
                  variables: {
                    id,
                    title,
                    description,
                    imageUrl,
                  },
                  optimisticResponse: {
                    __typename: 'Mutation',
                    updateItem: {
                      __typename: 'UpdateItemMutationPayload',
                      item: {
                        id,
                        __typename: 'Item',
                        title,
                        description,
                        imageUrl,
                      },
                      errors: null
                    },
                  },
                }).then(({data}) => {
                  console.log('errors in promise', data.updateItem.errors)
                  onErrors(data.updateItem.errors);
                });
                onClose();
              }}
            />
        )}
        </Mutation>
        <button type="button" className={cs.close} onClick={onClose}>
          Close
      </button>
      </div>
    </div>
)};

export default UpdateItemForm;
