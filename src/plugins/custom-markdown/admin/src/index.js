import { PLUGIN_ID } from './pluginId';
import { ImageIcon } from './components/ImageIcon';

export default {
  register(app) {
    app.customFields.register({
      name: 'rich-markdown',
      pluginId: PLUGIN_ID,
      type: 'text',
      icon: ImageIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.rich-markdown.label`,
        defaultMessage: 'Rich Markdown',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.rich-markdown.description`,
        defaultMessage: 'A markdown editor with Figure support for images with captions',
      },
      components: {
        Input: async () =>
          import('./components/MarkdownEditor').then((module) => ({
            default: module.MarkdownEditor,
          })),
      },
      options: {
        advanced: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.rich-markdown.settings`,
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: `${PLUGIN_ID}.rich-markdown.required`,
                  defaultMessage: 'Required field',
                },
                description: {
                  id: `${PLUGIN_ID}.rich-markdown.required.description`,
                  defaultMessage: 'You will not be able to create an entry if this field is empty',
                },
              },
            ],
          },
        ],
      },
    });
  },
};
