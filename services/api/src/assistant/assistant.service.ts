import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

const MAX_CONVERSATION_CHARS = 12_000;
const DAILY_LIMIT = Number(process.env.ASSISTANT_DAILY_LIMIT ?? 100);
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../geo/city.entity';
import { GeoService } from '../geo/geo.service';
import { GuidesService } from '../guides/guides.service';
import { AI_ASSISTANT, AiAssistant, AssistantContext } from '../providers/ai/ai-assistant.interface';
import { User } from '../users/user.entity';
import { ChatDto } from './dto';

@Injectable()
export class AssistantService {
  constructor(
    @Inject(AI_ASSISTANT) private readonly ai: AiAssistant,
    @InjectRepository(City) private readonly cities: Repository<City>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly geo: GeoService,
    private readonly guides: GuidesService,
  ) {}

  /** Rough per-caller daily budget (per API instance) against cost abuse. */
  private readonly daily = new Map<string, { day: string; count: number }>();

  private assertBudget(key: string) {
    const day = new Date().toISOString().slice(0, 10);
    const entry = this.daily.get(key);
    const count = entry && entry.day === day ? entry.count + 1 : 1;
    if (count > DAILY_LIMIT) {
      throw new HttpException("You've reached today's assistant limit. Try again tomorrow.", HttpStatus.TOO_MANY_REQUESTS);
    }
    this.daily.set(key, { day, count });
    if (this.daily.size > 100_000) this.daily.clear();
  }

  async chat(dto: ChatDto, userId?: string, ip?: string) {
    const chars = dto.messages.reduce((n, m) => n + m.content.length, 0);
    if (chars > MAX_CONVERSATION_CHARS) {
      throw new HttpException('This conversation is too long. Start a new chat.', HttpStatus.PAYLOAD_TOO_LARGE);
    }
    this.assertBudget(userId ? `u:${userId}` : `ip:${ip ?? 'unknown'}`);
    const city = await this.resolveCity(dto);
    const [user, sites, guides] = await Promise.all([
      userId ? this.users.findOneBy({ id: userId }) : null,
      this.geo.searchSites({ cityId: city?.id, page: 1, limit: 10 }),
      this.guides.search({ cityId: city?.id, page: 1, limit: 5, sort: 'rating' }),
    ]);

    const context: AssistantContext = {
      userName: user?.fullName,
      city: city ? { id: city.id, name: city.name, country: city.country.name } : null,
      sites: sites.items.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        city: s.city.name,
        description: s.description,
      })),
      guides: guides.items.map((g) => ({
        id: g.id,
        name: g.name ?? 'Guide',
        rating: g.ratingAvg,
        languages: g.languages,
        cities: g.cities.map((c) => c.name),
      })),
    };
    const reply = await this.ai.chat(dto.messages, context);
    return { ...reply, city: context.city };
  }

  /**
   * Explicit cityId wins; otherwise look for a known city — or one of its
   * sites — mentioned in the conversation (most recent message first).
   */
  private async resolveCity(dto: ChatDto): Promise<City | null> {
    if (dto.cityId) return this.cities.findOne({ where: { id: dto.cityId }, relations: { country: true } });
    const text = dto.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content.toLowerCase())
      .reverse()
      .join(' \n ');
    const all = await this.cities.find({ relations: { country: true, sites: true } });
    let best: { city: City; idx: number } | null = null;
    for (const c of all) {
      // "Petra — Al-Khazneh (Treasury)" -> "petra"
      const keywords = [c.name, ...c.sites.map((s) => s.name.split(/ — | \(/)[0])].map((k) => k.toLowerCase());
      for (const k of keywords) {
        const idx = text.indexOf(k);
        if (idx >= 0 && (!best || idx < best.idx)) best = { city: c, idx };
      }
    }
    return best?.city ?? null;
  }
}
