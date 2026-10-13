import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca a rota como acessível sem JWT (o guard global libera). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
