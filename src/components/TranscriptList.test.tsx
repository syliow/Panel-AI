/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TranscriptList } from './TranscriptList';
import { TranscriptItem } from '@/types';

// Mock the TranscriptMessage to simplify the test output
jest.mock('./TranscriptMessage', () => ({
  TranscriptMessage: ({ item }: { item: TranscriptItem }) => (
    <li className="mock-transcript-message" data-testid={item.id}>
      {item.text}
    </li>
  ),
}));

describe('TranscriptList', () => {
  const mockTranscript: TranscriptItem[] = [
    {
      id: '1',
      speaker: 'AI',
      text: 'Hello candidate',
      timestamp: 1234567890,
      isPartial: false,
    },
    {
      id: '2',
      speaker: 'Candidate',
      text: 'Hi there',
      timestamp: 1234567900,
      isPartial: false,
    },
  ];

  it('renders a semantic list of messages', () => {
    const html = renderToStaticMarkup(
      <TranscriptList transcript={mockTranscript} isAiSpeaking={false} />
    );

    // Should have a UL wrapper with accessibility attributes
    expect(html).toMatch(/<ul[^>]*role="log"[^>]*>/);
    expect(html).toMatch(/aria-live="polite"/);

    // Should have list items (from the mock)
    expect(html).toMatch(/<li/);

    // Should have the mock messages
    expect(html).toMatch(/Hello candidate/);
    expect(html).toMatch(/Hi there/);
  });
});
