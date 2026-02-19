'use strict';

module.exports = ({ strapi }) => {
  strapi.customFields.register({
    name: 'rich-markdown',
    plugin: 'custom-markdown',
    type: 'text',
    inputSize: {
      default: 12,
      isResizable: false,
    },
  });
};
