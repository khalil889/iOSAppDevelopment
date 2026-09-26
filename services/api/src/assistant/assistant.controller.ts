import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto';

@ApiTags('assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  /** Stateless: the client sends the running conversation each time. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('chat')
  chat(@Body() dto: ChatDto, @Ip() ip: string, @CurrentUser() user?: AuthUser) {
    return this.assistant.chat(dto, user?.id, ip);
  }
}
