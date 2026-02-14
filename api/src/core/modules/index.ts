import { configModule } from './config.module';
import { eventEmitterModule } from './event-emitter.module';
import { scheduleModule } from './schedule.module';
import { typeormForFeature, typeormForRoot } from './typeorm.module';

export const modules = [
  configModule,
  eventEmitterModule,
  scheduleModule,
  typeormForRoot,
  typeormForFeature,
];
