import React, { useCallback, useMemo, useState, useRef, forwardRef } from 'react';
import { useIntl } from 'react-intl';
import { Field } from '@strapi/design-system';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { FigureModal } from './FigureModal';

export const MarkdownEditor = forwardRef((props, ref) => {
  const {
    attribute,
    disabled,
    intlLabel,
    name,
    onChange,
    required,
    value,
    error,
    hint,
  } = props;

  const { formatMessage } = useIntl();
  const [showFigureModal, setShowFigureModal] = useState(false);
  const editorRef = useRef(null);

  const handleChange = useCallback(
    (newValue) => {
      onChange({
        target: {
          name,
          type: attribute.type,
          value: newValue,
        },
      });
    },
    [name, onChange, attribute.type]
  );

  const insertFigure = useCallback(
    (imageUrl, caption, align) => {
      const figureSyntax = caption
        ? `![${caption}${align !== 'center' ? `|${align}` : ''}](${imageUrl})`
        : `![|${align}](${imageUrl})`;

      const editor = editorRef.current;
      if (editor && editor.codemirror) {
        const cm = editor.codemirror;
        const cursor = cm.getCursor();
        cm.replaceRange(`\n${figureSyntax}\n`, cursor);
        cm.focus();
      } else {
        const newValue = value ? `${value}\n${figureSyntax}\n` : `${figureSyntax}\n`;
        handleChange(newValue);
      }

      setShowFigureModal(false);
    },
    [value, handleChange]
  );

  const options = useMemo(
    () => ({
      autofocus: false,
      spellChecker: false,
      status: false,
      placeholder: formatMessage({
        id: 'custom-markdown.editor.placeholder',
        defaultMessage: 'Write your content here...',
      }),
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        {
          name: 'figure',
          action: () => setShowFigureModal(true),
          className: 'fa fa-picture-o',
          title: 'Insert Figure with Caption',
        },
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide',
      ],
    }),
    [formatMessage]
  );

  const getMdeInstance = useCallback((instance) => {
    editorRef.current = instance;
  }, []);

  const label = intlLabel
    ? formatMessage({
        id: intlLabel.id,
        defaultMessage: intlLabel.defaultMessage,
      })
    : name;

  return (
    <Field.Root name={name} error={error} hint={hint} required={required}>
      <Field.Label>{label}</Field.Label>
      <div
        style={{
          border: error ? '1px solid #d02b20' : '1px solid #dcdce4',
          borderRadius: '4px',
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <SimpleMDE
          ref={ref}
          value={value || ''}
          onChange={handleChange}
          options={options}
          getMdeInstanceCallback={getMdeInstance}
        />
      </div>
      <Field.Hint />
      <Field.Error />

      {showFigureModal && (
        <FigureModal
          onClose={() => setShowFigureModal(false)}
          onInsert={insertFigure}
        />
      )}
    </Field.Root>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';
