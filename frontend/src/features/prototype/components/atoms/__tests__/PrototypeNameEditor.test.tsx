import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';

import PrototypeNameEditor from '../PrototypeNameEditor';

describe('PrototypeNameEditor', () => {
  it('shows reason when editing is disabled', () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <PrototypeNameEditor
          prototypeId="p1"
          name="test project"
          onUpdated={() => {}}
          editable={false}
          notEditableReason="管理者のみ名前を変更できます"
        />
      </QueryClientProvider>
    );

    const nameDisplay = screen.getByText('test project');
    expect(nameDisplay).toHaveAttribute(
      'title',
      'test project - 管理者のみ名前を変更できます'
    );
    // Avoid asserting exact CSS utility classes; behavior is verified via title.
  });
});
