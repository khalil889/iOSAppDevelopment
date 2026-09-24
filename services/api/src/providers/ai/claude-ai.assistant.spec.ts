import Anthropic from '@anthropic-ai/sdk';
import { fakeConfig } from '../test-helpers';
import { AssistantContext } from './ai-assistant.interface';
import { ClaudeAiAssistant } from './claude-ai.assistant';

const ctx: AssistantContext = {
  userName: 'Sara Williams',
  city: { id: 'c1', name: 'AlUla', country: 'Saudi Arabia' },
  sites: [{ id: 's1', name: 'Hegra', category: 'HERITAGE', city: 'AlUla', description: 'Nabataean tombs' }],
  guides: [{ id: 'g1', name: 'Noura Al-Qahtani', rating: 4.5, languages: ['ar', 'en', 'fr'], cities: ['AlUla'] }],
};

function fakeClient(result: Partial<Anthropic.Beta.BetaMessage> | Error) {
  const create = jest.fn(async () => {
    if (result instanceof Error) throw result;
    return { stop_reason: 'end_turn', content: [], ...result };
  });
  return { client: { beta: { messages: { create } } } as unknown as Pick<Anthropic, 'beta'>, create };
}

const text = (t: string) => [{ type: 'text', text: t, citations: null }] as Anthropic.Beta.BetaContentBlock[];
const config = fakeConfig({ anthropic: { model: 'claude-opus-5', effort: 'low' } });

describe('ClaudeAiAssistant', () => {
  it('sends a stable system prompt, the marketplace data and a JSON schema', async () => {
    const { client, create } = fakeClient({ content: text(JSON.stringify({ reply: 'Visit Hegra.', suggestions: [] })) });
    await new ClaudeAiAssistant(config, client).chat(
      [
        { role: 'assistant', content: 'Hi! Where are you going?' },
        { role: 'user', content: 'AlUla' },
        { role: 'assistant', content: 'Great choice.' },
        { role: 'user', content: 'What should I see?' },
      ],
      ctx,
    );

    const params = (create.mock.calls[0] as unknown[])[0] as Record<string, any>;
    expect(params.model).toBe('claude-opus-5');
    expect(params.fallbacks).toBe('default');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params.output_config).toMatchObject({ effort: 'low', format: { type: 'json_schema' } });
    expect(params.system).toMatch(/licensed/);
    expect(params.system).not.toContain('Hegra'); // context never leaks into the cached system prompt
    // Leading assistant turn dropped; data attached to the last user turn.
    expect(params.messages[0]).toEqual({ role: 'user', content: 'AlUla' });
    const last = params.messages[params.messages.length - 1];
    expect(last.content[0].text).toContain('"Hegra"');
    expect(last.content[1].text).toBe('What should I see?');
  });

  it('keeps only suggestions that exist in the marketplace data', async () => {
    const { client } = fakeClient({
      content: text(
        JSON.stringify({
          reply: 'Book Noura for Hegra.',
          suggestions: [
            { type: 'guide', id: 'g1' },
            { type: 'guide', id: 'invented' },
            { type: 'site', id: 's1' },
            { type: 'site', id: 's1' },
          ],
        }),
      ),
    });
    const res = await new ClaudeAiAssistant(config, client).chat([{ role: 'user', content: 'guide?' }], ctx);
    expect(res).toEqual({
      reply: 'Book Noura for Hegra.',
      provider: 'claude',
      suggestions: [
        { type: 'guide', id: 'g1', title: 'Noura Al-Qahtani' },
        { type: 'site', id: 's1', title: 'Hegra' },
      ],
    });
  });

  it('answers politely on refusal', async () => {
    const { client } = fakeClient({ stop_reason: 'refusal', content: [] });
    const res = await new ClaudeAiAssistant(config, client).chat([{ role: 'user', content: '...' }], ctx);
    expect(res.provider).toBe('claude');
    expect(res.suggestions).toEqual([]);
    expect(res.reply).toMatch(/can't help/);
  });

  it.each([
    ['an API error', new Anthropic.APIError(529, { type: 'error' }, 'Overloaded', new Headers())],
    ['a truncated response', { stop_reason: 'max_tokens', content: text('{"reply": "Vis') } as Partial<Anthropic.Beta.BetaMessage>],
    ['invalid JSON', { content: text('not json') } as Partial<Anthropic.Beta.BetaMessage>],
  ])('falls back to the rule-based assistant on %s', async (_label, result) => {
    const { client } = fakeClient(result as Partial<Anthropic.Beta.BetaMessage> | Error);
    const res = await new ClaudeAiAssistant(config, client).chat([{ role: 'user', content: 'find me a guide' }], ctx);
    expect(res.provider).toBe('stub');
    expect(res.reply).toContain('Noura');
  });
});
