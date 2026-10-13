/**
 * Seed idempotente: pode rodar várias vezes sem duplicar dados.
 * Cria 1 OWNER, 1 evento, seções, ingressos e SEO (dados fictícios).
 */
import { EventRole, PrismaClient, SectionType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'owner@eventhub.local';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? 'Senha@12345';
const EVENT_SLUG = 'festival-demo';

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      name: 'Organizador Demo',
      passwordHash: await argon2.hash(OWNER_PASSWORD, { type: argon2.argon2id }),
    },
  });

  // Recria o evento demo do zero (cascade apaga seções, ingressos etc.).
  await prisma.event.deleteMany({ where: { slug: EVENT_SLUG } });

  await prisma.event.create({
    data: {
      slug: EVENT_SLUG,
      name: 'Festival Demo 2026',
      status: 'PUBLISHED',
      startsAt: new Date('2026-12-12T18:00:00-03:00'),
      endsAt: new Date('2026-12-13T02:00:00-03:00'),
      venueName: 'Centro de Eventos Demo',
      address: 'Av. Exemplo, 1000 - Fortaleza, CE',
      description: 'Um festival fictício para testar o Event CMS.',
      members: { create: { userId: owner.id, role: EventRole.OWNER } },
      settings: {
        create: {
          socialLinks: { instagram: 'https://instagram.com/festivaldemo' },
          footerText: '© 2026 Festival Demo. Todos os direitos reservados.',
        },
      },
      seo: {
        create: {
          metaTitle: 'Festival Demo 2026',
          metaDescription: 'Música, gastronomia e cultura em uma noite inesquecível.',
          keywords: ['festival', 'música', 'fortaleza'],
          ogTitle: 'Festival Demo 2026',
          ogDescription: 'Garanta já seu ingresso.',
        },
      },
      sections: {
        create: [
          { type: SectionType.HERO, order: 0, title: 'Festival Demo 2026', content: { subtitle: '12 de dezembro • Fortaleza', ctaLabel: 'Comprar ingresso' } },
          { type: SectionType.ABOUT, order: 1, title: 'Sobre o evento', content: { text: 'Uma noite com os melhores artistas da região.' } },
          { type: SectionType.SCHEDULE, order: 2, title: 'Programação', content: { items: [{ time: '18:00', title: 'Abertura' }, { time: '20:00', title: 'Show principal' }] } },
          { type: SectionType.TICKETS, order: 3, title: 'Ingressos', content: {} },
          { type: SectionType.LOCATION, order: 4, title: 'Localização', content: {} },
          { type: SectionType.FAQ, order: 5, title: 'Perguntas frequentes', content: { items: [{ question: 'Pode levar criança?', answer: 'Sim, até 12 anos acompanhada.' }] } },
        ],
      },
      tickets: {
        create: [
          { name: 'Pista', description: 'Acesso à área geral', priceCents: 8000, quantityTotal: 1000, quantitySold: 420 },
          { name: 'VIP', description: 'Área exclusiva com open bar', priceCents: 15000, quantityTotal: 500, quantitySold: 188 },
        ],
      },
    },
  });

  console.log(`Seed ok → login: ${OWNER_EMAIL} / ${OWNER_PASSWORD} · evento: ${EVENT_SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
