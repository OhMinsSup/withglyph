import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { createNodeView } from '../../lib';
import Component from './Component.svelte';

declare module '@tiptap/core' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Commands<ReturnType> {
    gallery: {
      setGallery: () => ReturnType;
    };
  }
}

export const Gallery = createNodeView(Component, {
  name: 'gallery',
  group: 'block',
  draggable: true,

  addAttributes() {
    return {
      layout: { default: 'standalone' },
      gridColumns: { default: 2 },
      slidesPerPage: { default: 1 },
      spacing: { default: false },
      ids: { default: [] },
      __data: { default: [] },
    };
  },

  addCommands() {
    return {
      setGallery:
        () =>
        ({ state, tr }) => {
          const { selection } = state;
          const { $to } = selection;

          const pos = selection instanceof TextSelection ? $to.end() + 1 : $to.pos;

          tr.insert(pos, this.type.create());
          tr.setSelection(NodeSelection.create(tr.doc, pos));
          tr.scrollIntoView();

          return tr.docChanged;
        },
    };
  },
});
