import { Injectable } from '@nestjs/common';
import { AiAssistant, AssistantContext, AssistantReply, ChatMessage, Suggestion } from './ai-assistant.interface';

/**
 * Rule-based stand-in for an LLM: recognises a few intents and answers from
 * the marketplace context the service supplies.
 */
@Injectable()
export class StubAiAssistant implements AiAssistant {
  readonly name = 'stub';

  async chat(messages: ChatMessage[], ctx: AssistantContext): Promise<AssistantReply> {
    const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const q = last.toLowerCase();
    const where = ctx.city ? ` in ${ctx.city.name}` : '';
    const suggestions: Suggestion[] = [];

    if (/\b(guide|guides|who can|tour guide)\b/.test(q)) {
      const guides = ctx.guides.slice(0, 3);
      if (!guides.length) {
        return this.reply(`I couldn't find verified guides${where} yet. Try another city.`, []);
      }
      guides.forEach((g) => suggestions.push({ type: 'guide', id: g.id, title: g.name }));
      const list = guides
        .map((g) => `• ${g.name} — ★${g.rating.toFixed(1)}, speaks ${g.languages.join(', ').toUpperCase()}`)
        .join('\n');
      return this.reply(`Here are top-rated licensed guides${where}:\n${list}\nTap one to view their profile and book.`, suggestions);
    }

    if (/\b(itinerary|plan|day|days|trip)\b/.test(q)) {
      const days = Math.min(Math.max(Number(q.match(/(\d+)\s*day/)?.[1] ?? 2), 1), 5);
      const sites = ctx.sites.slice(0, days * 2);
      if (!sites.length) return this.reply(`Tell me which city you're visiting and I'll draft an itinerary.`, []);
      sites.forEach((s) => suggestions.push({ type: 'site', id: s.id, title: s.name }));
      const plan = Array.from({ length: days }, (_, i) => {
        const [am, pm] = [sites[i * 2], sites[i * 2 + 1]];
        return `Day ${i + 1}: ${am ? `morning at ${am.name}` : 'free morning'}${pm ? `, afternoon at ${pm.name}` : ''}`;
      }).join('\n');
      return this.reply(`Here's a ${days}-day plan${where}:\n${plan}\nWant me to find a licensed guide for any of these?`, suggestions);
    }

    if (/\b(safe|safety|emergency|sos)\b/.test(q)) {
      return this.reply(
        'During a live tour, the SOS button shares your location with our support team and your guide. ' +
          'For life-threatening emergencies always call local emergency services first.',
        [],
      );
    }

    if (/\b(see|visit|places|sites|attractions|what to do)\b/.test(q) || ctx.city) {
      const sites = ctx.sites.slice(0, 4);
      if (sites.length) {
        sites.forEach((s) => suggestions.push({ type: 'site', id: s.id, title: s.name }));
        const list = sites.map((s) => `• ${s.name} (${s.category.toLowerCase()})`).join('\n');
        return this.reply(`Popular places${where}:\n${list}`, suggestions);
      }
    }

    return this.reply(
      `Hi${ctx.userName ? ` ${ctx.userName.split(' ')[0]}` : ''}! I can suggest places to visit, draft an itinerary, ` +
        'or find a licensed guide. Which city are you heading to?',
      [],
    );
  }

  private reply(reply: string, suggestions: Suggestion[]): AssistantReply {
    return { reply, suggestions, provider: this.name };
  }
}
