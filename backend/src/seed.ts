import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_EMPLOYEE_PERMISSIONS = [
  'cases:view',
  'cases:create',
  'cases:edit',
  'cases:accept',
  'cases:decline',
  'cases:status',
  'cases:close',
  'projects:view',
  'projects:create',
  'projects:edit',
  'projects:status',
  'projects:complete',
  'customers:view',
  'customers:create',
  'customers:edit',
  'quotations:view',
  'quotations:create',
  'quotations:edit',
  'quotations:issue',
  'messages:view',
  'messages:send',
  'products:view',
];

async function main() {
  console.log('🌱 Seeding Betongportalen database...');

  // 1. Application Settings
  const settings = await prisma.applicationSettings.upsert({
    where: { id: 'default-settings' },
    update: {
      currency: 'SEK',
      productCategories: JSON.stringify([
        'Ready-mix Concrete',
        'Semi-dry Concrete',
        'Precast & Kerbstones',
        'Special Mixes',
        'Aggregates',
      ]),
      measurementUnits: 'm³,tonnes,pieces,pallets,running meters',
    },
    create: {
      id: 'default-settings',
      companyName: 'Betongportalen AB',
      companyLogoUrl: '/logo.svg',
      orgNumber: '556812-3490',
      vatNumber: 'SE556812349001',
      address: 'Klarabergsviadukten 70, 111 64 Stockholm',
      supportEmail: 'kontakt@betongportalen.se',
      supportPhone: '+46 (0)8 400 120 00',
      defaultVatRate: 25.0,
      currency: 'SEK',
      defaultQuotationTerms:
        'Offer is valid for 14 days from issue date. Delivery is carried out in according to Nordic transport terms and requires suitable access roads for heavy vehicles (min 3.5m width, 4.0m clearance). Unloading time up to 30 minutes per truck is included. Extra discharge/pump time billed separately.',
      productCategories: JSON.stringify([
        'Ready-mix Concrete',
        'Semi-dry Concrete',
        'Precast & Kerbstones',
        'Special Mixes',
        'Aggregates',
      ]),
      measurementUnits: 'm³,tonnes,pieces,pallets,running meters',
      dataRetentionDays: 1825,
    },
  });
  console.log('✅ Settings initialized');

  // 2. Staff Users (Admin & Employee)
  const adminPassword = await bcrypt.hash('admin12345', 10);
  const staffPassword = await bcrypt.hash('staff12345', 10);

  const admin = await prisma.staffUser.upsert({
    where: { email: 'admin@betongportalen.se' },
    update: {
      role: 'ADMINISTRATOR',
      phone: '+46 8 400 120 01',
    },
    create: {
      email: 'admin@betongportalen.se',
      passwordHash: adminPassword,
      name: 'Astrid Lindgren (Admin)',
      phone: '+46 8 400 120 01',
      role: 'ADMINISTRATOR',
      isActive: true,
      lastLogin: new Date(),
    },
  });

  const staff = await prisma.staffUser.upsert({
    where: { email: 'erik.svensson@betongportalen.se' },
    update: {
      role: 'EMPLOYEE',
      permissions: JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS),
      phone: '+46 70 812 34 50',
    },
    create: {
      email: 'erik.svensson@betongportalen.se',
      passwordHash: staffPassword,
      name: 'Erik Svensson (Concrete Specialist)',
      phone: '+46 70 812 34 50',
      role: 'EMPLOYEE',
      permissions: JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS),
      isActive: true,
      lastLogin: new Date(),
    },
  });
  console.log('✅ Staff accounts configured');

  // 3. Product Categories
  const categories = [
    { name: 'Ready-mix Concrete', description: 'Fluid concrete delivered in transit mixers', sortOrder: 1 },
    { name: 'Semi-dry Concrete', description: 'Earth-moist dry-pack concrete for kerbs and paving', sortOrder: 2 },
    { name: 'Precast & Kerbstones', description: 'Precast boundary stones and modular concrete elements', sortOrder: 3 },
    { name: 'Special Mixes', description: 'Self-compacting, fibre-reinforced and waterproof concrete', sortOrder: 4 },
    { name: 'Aggregates', description: 'Crushed gravel, base courses and compacting rock', sortOrder: 5 },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
  }

  // 4. Products
  const products = [
    {
      name: 'Ready-mix concrete C25/30',
      category: 'Ready-mix Concrete',
      description: 'Standard building concrete for slabs on ground, footings, and retaining walls. Workability slump 150-180mm.',
      defaultUnit: 'm³',
      availableUnits: 'm³,tonnes',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Ready-mix concrete C30/37 (High Strength)',
      category: 'Ready-mix Concrete',
      description: 'Frost-resistant concrete (exposure class XF4/XC4) ideal for garage slabs, driveways, and industrial floors.',
      defaultUnit: 'm³',
      availableUnits: 'm³,tonnes',
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Semi-dry concrete (Jordfuktig betong)',
      category: 'Semi-dry Concrete',
      description: 'Earth-moist concrete used for setting kerbstones, paving slabs, and dry-pack foundations.',
      defaultUnit: 'm³',
      availableUnits: 'm³,tonnes',
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Self-compacting concrete (SKB)',
      category: 'Special Mixes',
      description: 'Fluid, vibration-free concrete that achieves smooth surface finish and reaches dense reinforcement easily.',
      defaultUnit: 'm³',
      availableUnits: 'm³',
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Concrete kerbstones (Kantsten betong standard)',
      category: 'Precast & Kerbstones',
      description: 'Straight standard kerbstones (type A/B, 1000x300x150 mm) for parking, municipal and residential roads.',
      defaultUnit: 'pieces',
      availableUnits: 'pieces,running meters,pallets',
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'Crushed rock / Aggregate 0-32 (Bärlager)',
      category: 'Aggregates',
      description: 'Compacting base course material for ground preparation beneath concrete slabs and pavements.',
      defaultUnit: 'tonnes',
      availableUnits: 'tonnes,m³',
      isActive: true,
      sortOrder: 6,
    },
  ];

  for (const prod of products) {
    const cat = await prisma.productCategory.findUnique({ where: { name: prod.category } });
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...prod,
          categoryId: cat?.id || null,
        },
      });
    }
  }
  console.log('✅ Products & Categories initialized');

  // 5. Customers
  const customer1 = await prisma.customer.upsert({
    where: { email: 'lars.johansson@nordicbygg.se' },
    update: {},
    create: {
      name: 'Lars Johansson',
      customerType: 'BUSINESS',
      companyName: 'Nordic Bygg & Anläggning AB',
      email: 'lars.johansson@nordicbygg.se',
      phone: '+46 70 812 34 56',
      address: 'Industrivägen 12, 142 45 Skogås, Stockholm',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: 'karin.nilsson@gmail.com' },
    update: {},
    create: {
      name: 'Karin Nilsson',
      customerType: 'INDIVIDUAL',
      email: 'karin.nilsson@gmail.com',
      phone: '+46 72 345 67 89',
      address: 'Villa Solbacken, Björkvägen 8, 182 50 Djursholm',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: 'henrik.lund@skanska.se' },
    update: {},
    create: {
      name: 'Henrik Lund',
      customerType: 'BUSINESS',
      companyName: 'Skanska Sverige Commercial Projects',
      email: 'henrik.lund@skanska.se',
      phone: '+46 70 999 88 77',
      address: 'Warfvinges väg 25, 112 51 Stockholm',
    },
  });
  console.log('✅ Customers initialized');

  // 6. Link or Create Sample Cases with Customer FK
  let case1 = await prisma.case.findUnique({ where: { caseNumber: 'BP-2026-X89K2P' } });
  if (case1 && !case1.customerId) {
    case1 = await prisma.case.update({
      where: { id: case1.id },
      data: { customerId: customer1.id },
    });
  }

  let case2 = await prisma.case.findUnique({ where: { caseNumber: 'BP-2026-M43R7Y' } });
  if (case2 && !case2.customerId) {
    case2 = await prisma.case.update({
      where: { id: case2.id },
      data: { customerId: customer2.id },
    });
  }

  // 7. Seed Sample Projects
  const quotation1 = await prisma.quotation.findFirst({ where: { caseId: case1?.id } });

  const project1Id = 'BP-PRJ-2026-0001';
  let project1 = await prisma.project.findUnique({ where: { projectId: project1Id } });
  if (!project1 && case1) {
    project1 = await prisma.project.create({
      data: {
        projectId: project1Id,
        name: 'Skogås Logistics Hub Foundation Casting',
        description: 'Complete industrial foundation slab casting with 24m boom pump delivery sequence.',
        customerId: customer1.id,
        caseId: case1.id,
        quotationId: quotation1?.id || null,
        status: 'IN_PROGRESS',
        progress: 60,
        location: 'Industrivägen 12, 142 45 Skogås',
        projectValue: 64000,
        approvedValue: 51200,
        vatAmount: 12800,
        currency: 'SEK',
        startDate: new Date(Date.now() - 86400000 * 3),
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 7),
        assignedStaffId: staff.id,
        materials: {
          create: [
            {
              productName: 'Ready-mix concrete C30/37 S4 Dmax16',
              description: 'Industrial floor casting',
              quantity: 32,
              unit: 'm³',
              deliveryAddress: 'Industrivägen 12, Skogås',
              deliveryDate: new Date(Date.now() + 86400000 * 7),
              technicalRequirements: 'Slump S4 (180mm), exposure XC2, 24m boom pump required',
            },
          ],
        },
        statusHistory: {
          createMany: {
            data: [
              {
                fromStatus: null,
                toStatus: 'NEW',
                notes: 'Project created from accepted inquiry BP-2026-X89K2P',
                changedByStaffId: staff.id,
                progress: 10,
                createdAt: new Date(Date.now() - 86400000 * 3),
              },
              {
                fromStatus: 'NEW',
                toStatus: 'APPROVED',
                notes: 'Commercial quotation accepted by customer. Batching plant schedule booked.',
                changedByStaffId: staff.id,
                progress: 35,
                createdAt: new Date(Date.now() - 86400000 * 2),
              },
              {
                fromStatus: 'APPROVED',
                toStatus: 'IN_PROGRESS',
                notes: 'Site inspection completed. Road clearance verified for heavy transit mixers.',
                changedByStaffId: staff.id,
                progress: 60,
                createdAt: new Date(Date.now() - 86400000 * 1),
              },
            ],
          },
        },
      },
    });
  }

  const project2Id = 'BP-PRJ-2026-0002';
  let project2 = await prisma.project.findUnique({ where: { projectId: project2Id } });
  if (!project2) {
    project2 = await prisma.project.create({
      data: {
        projectId: project2Id,
        name: 'Djursholm Villa Patio & Garden Kerbstones',
        description: 'Dry-pack foundation and kerbstones for garden restructuring.',
        customerId: customer2.id,
        caseId: case2?.id || null,
        status: 'PLANNING',
        progress: 20,
        location: 'Villa Solbacken, Björkvägen 8, 182 50 Djursholm',
        projectValue: 28500,
        approvedValue: 22800,
        vatAmount: 5700,
        currency: 'SEK',
        startDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 12),
        assignedStaffId: staff.id,
        materials: {
          create: [
            {
              productName: 'Semi-dry concrete (Jordfuktig betong)',
              description: 'Earth-moist mix for kerbstone foundation',
              quantity: 14,
              unit: 'm³',
              deliveryAddress: 'Björkvägen 8, Djursholm',
              deliveryDate: new Date(Date.now() + 86400000 * 12),
              technicalRequirements: 'Max vehicle weight 20 tonnes due to local road limit',
            },
          ],
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'PLANNING',
            notes: 'Project initiated and assigned to concrete specialist',
            changedByStaffId: staff.id,
            progress: 20,
          },
        },
      },
    });
  }

  // 8. Seed Audit Log entries
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project1Id,
        staffUserId: staff.id,
        description: 'Project BP-PRJ-2026-0001 converted from inquiry BP-2026-X89K2P',
        details: 'Initial value 64,000 SEK',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        action: 'PROJECT_STATUS_UPDATED',
        entityType: 'Project',
        entityId: project1Id,
        staffUserId: staff.id,
        description: 'Progress updated to 60% (IN_PROGRESS)',
        details: 'Site road clearance approved',
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  console.log('✅ Projects & Audit logs populated');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
