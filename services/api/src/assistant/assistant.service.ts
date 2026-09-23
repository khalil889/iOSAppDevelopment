import { Inject, Injectable } from '@nestjs/common';
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

  async chat(dto: ChatDto, userId?: string) {
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

  /** Explicit cityId wins; otherwise look for a known city name in the conversation. */
  private async resolveCity(dto: ChatDto): Promise<City | null> {
    if (dto.cityId) return this.cities.findOne({ where: { id: dto.cityId }, relations: { country: true } });
    const text = dto.messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase()).reverse().join(' \n ');
    const all = await this.cities.find({ relations: { country: true } });
    let best: { city: City; idx: number } | null = null;
    for (const c of all) {
      const idx = text.indexOf(c.name.toLowerCase());
      if (idx >= 0 && (!best || idx < best.idx)) best = { city: c, idx };
    }
    return best?.city ?? null;
  }
}
