import { postControllers } from './posts';
import { trashControllers } from './trash';

export const controllers = [...postControllers, ...trashControllers];
