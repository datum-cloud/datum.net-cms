import React, { useState } from 'react';
import {
  Modal,
  Button,
  TextInput,
  SingleSelect,
  SingleSelectOption,
  Flex,
  Typography,
} from '@strapi/design-system';

export const FigureModal = ({ onClose, onInsert }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [align, setAlign] = useState('center');

  const handleInsert = () => {
    if (!imageUrl.trim()) {
      return;
    }
    onInsert(imageUrl.trim(), caption.trim(), align);
  };

  return (
    <Modal.Root open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Insert Figure</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4}>
            <TextInput
              label="Image URL"
              placeholder="/uploads/image.jpg or https://..."
              name="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
            <TextInput
              label="Caption"
              placeholder="Enter image caption (optional)"
              name="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <Flex direction="column" gap={1}>
              <Typography variant="pi" fontWeight="bold">
                Alignment
              </Typography>
              <SingleSelect
                value={align}
                onChange={setAlign}
              >
                <SingleSelectOption value="left">Left</SingleSelectOption>
                <SingleSelectOption value="center">Center</SingleSelectOption>
                <SingleSelectOption value="right">Right</SingleSelectOption>
              </SingleSelect>
            </Flex>
            <Flex
              direction="column"
              gap={2}
              padding={3}
              background="neutral100"
              borderRadius="4px"
            >
              <Typography variant="sigma" textColor="neutral600">
                Preview syntax:
              </Typography>
              <Typography variant="omega" fontWeight="bold">
                {caption
                  ? `![${caption}${align !== 'center' ? `|${align}` : ''}](${imageUrl || '/uploads/image.jpg'})`
                  : `![${align !== 'center' ? `|${align}` : ''}](${imageUrl || '/uploads/image.jpg'})`}
              </Typography>
            </Flex>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Cancel</Button>
          </Modal.Close>
          <Button onClick={handleInsert} disabled={!imageUrl.trim()}>
            Insert Figure
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
