import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { join } from 'path';

import type { AppConfig } from '../config/config';

@Injectable()
export class DirectoryService {
  private readonly config: AppConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AppConfig>('root')!;
  }

  dataDir(...segments: string[]): string {
    return join(this.config.dir.data, ...segments);
  }

  ensureDataDir(...segments: string[]): string {
    const dir = this.dataDir(...segments);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  databasePath(): string {
    return join(this.config.dir.data, 'blissey.db');
  }
}
