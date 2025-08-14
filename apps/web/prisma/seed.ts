import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.upsert({
    where: { slug: "moviecook-device" },
    create: {
      slug: "moviecook-device",
      name: "MovieCook Device",
      description: "Stacked AI hardware for real-time feature-length generation.",
      images: {
        create: [
          { url: "/images/moviecook-hero.jpg", alt: "MovieCook device", position: 0 },
        ],
      },
      variants: {
        create: [
          {
            sku: "MC-BASE-001",
            title: "Base Unit",
            priceCents: 499000,
            currency: "USD",
            inventory: 50,
          },
        ],
      },
    },
    update: {},
  });

  await prisma.collection.upsert({
    where: { slug: "featured" },
    create: {
      slug: "featured",
      name: "Featured",
      items: { create: [{ productId: product.id }] },
    },
    update: {},
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


