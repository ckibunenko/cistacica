import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BELGRADE_ZONES } from "../lib/constants";
import { calculatePrice } from "../lib/services/pricing";
import type { BookingStatus, PaymentStatus, RecurrencePreference } from "../lib/types";

const prisma = new PrismaClient();

const password = "Admin123!";
const customerPassword = "Korisnik123!";
const cleanerPassword = "Cistac123!";

function datePlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function code(index: number) {
  return `CD-DEMO-${String(index).padStart(3, "0")}`;
}

function nameParts(name: string) {
  const [firstName, ...rest] = name.split(" ");
  return {
    firstName: firstName || name,
    lastName: rest.join(" ") || "Demo"
  };
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.adminNote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.incidentReport.deleteMany();
  await prisma.review.deleteMany();
  await prisma.bookingAddOn.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.cleanerAvailability.deleteMany();
  await prisma.cleanerZone.deleteMany();
  await prisma.cleanerProfile.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.coverageZone.deleteMany();
  await prisma.user.deleteMany();

  await prisma.coverageZone.createMany({
    data: [
      ...BELGRADE_ZONES.map((zone) => ({
        city: "Beograd",
        zone: zone.name,
        isActive: zone.isActive,
        isComingSoon: !zone.isActive
      })),
      { city: "Novi Sad", zone: "Centar", isActive: false, isComingSoon: true }
    ]
  });

  const [regular, standard, deep] = await Promise.all([
    prisma.serviceType.create({
      data: {
        code: "regular",
        name: "Redovno čišćenje",
        description: "Održavanje doma nakon početnog sređivanja.",
        hourlyRateRsd: 1100,
        minHours: 3,
        isActive: true
      }
    }),
    prisma.serviceType.create({
      data: {
        code: "standard",
        name: "Standardno čišćenje",
        description: "Detaljnije čišćenje kuhinje, kupatila i dnevnih prostorija.",
        hourlyRateRsd: 1300,
        minHours: 3,
        isActive: true
      }
    }),
    prisma.serviceType.create({
      data: {
        code: "deep",
        name: "Dubinsko čišćenje",
        description: "Uskoro za zahtevnije termine i useljenja.",
        hourlyRateRsd: 1600,
        minHours: 4,
        isActive: false
      }
    })
  ]);
  void deep;

  const addOns = await Promise.all([
    prisma.addOn.create({
      data: {
        code: "windows_inside",
        name: "Pranje prozora iznutra",
        description: "Unutrašnja strana prozora.",
        priceRsd: 1500,
        isActive: true
      }
    }),
    prisma.addOn.create({
      data: { code: "oven", name: "Rerna", description: "Čišćenje rerne.", priceRsd: 800, isActive: true }
    }),
    prisma.addOn.create({
      data: { code: "fridge", name: "Frižider", description: "Čišćenje frižidera.", priceRsd: 700, isActive: true }
    }),
    prisma.addOn.create({
      data: { code: "ironing", name: "Peglanje", description: "Cena po satu.", priceRsd: 700, isActive: true }
    }),
    prisma.addOn.create({
      data: {
        code: "cleaning_supplies",
        name: "Sredstva za čišćenje",
        description: "Pružalac donosi osnovna sredstva.",
        priceRsd: 500,
        isActive: true
      }
    })
  ]);

  const passwordHash = await bcrypt.hash(password, 12);
  const customerHash = await bcrypt.hash(customerPassword, 12);
  const cleanerHash = await bcrypt.hash(cleanerPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@cistodom.local",
      passwordHash,
      role: "ADMIN",
      firstName: "CistoDom",
      lastName: "Operacije",
      name: "CistoDom Operacije",
      phone: "+381600000001",
      status: "ACTIVE"
    }
  });

  const customers = await Promise.all(
    [
      ["milica@demo.local", "Milica Jovanović", "Bulevar kralja Aleksandra 52", "Vračar"],
      ["marko@demo.local", "Marko Petrović", "Kralja Petra 18", "Stari grad"],
      ["ana@demo.local", "Ana Nikolić", "Jurija Gagarina 144", "Novi Beograd"]
    ].map(([email, name, address, zone], index) => {
      const parts = nameParts(name);
      return prisma.user.create({
          data: {
            email,
            ...parts,
            name,
            phone: `+3816011122${index}`,
            passwordHash: customerHash,
            role: "CUSTOMER",
            status: "ACTIVE",
            customerProfile: {
              create: {
                defaultAddress: address,
                city: "Beograd",
                zone,
                floor: index === 2 ? "8" : "2",
                apartment: index === 1 ? "12" : "5",
                intercom: index === 0 ? "Jovanovic" : "Pozvoniti",
                propertyType: "Stan",
                hasPets: index === 0,
                petNotes: index === 0 ? "Mali pas, nije agresivan." : null,
                preferredTimeWindows: index === 1 ? "Radnim danima posle 16h" : "Jutarnji termini",
                preferredFrequency: index === 2 ? "WEEKLY" : "EVERY_TWO_WEEKS",
                accessNotes: "Javiti se porukom pre dolaska.",
                notes: "Demo korisnik sa popunjenim operativnim profilom."
              }
            }
          }
        });
      }
    )
  );

  const cleanerSeed = [
    ["jelena@clean.local", "Jelena Simić", "VERIFIED", true, ["Vračar", "Stari grad"]],
    ["ivana@clean.local", "Ivana Ilić", "VERIFIED", true, ["Novi Beograd", "Savski venac"]],
    ["sanja@clean.local", "Sanja Pavlović", "VERIFIED", true, ["Vračar", "Savski venac"]],
    ["marija@clean.local", "Marija Lukić", "VERIFIED", true, ["Stari grad", "Novi Beograd"]],
    ["nikola@clean.local", "Nikola Ristić", "VERIFIED", true, ["Novi Beograd"]],
    ["tanja@clean.local", "Tanja Đorđević", "PENDING", false, ["Vračar"]],
    ["bojan@clean.local", "Bojan Milić", "PENDING", false, ["Savski venac"]],
    ["katarina@clean.local", "Katarina Popović", "REJECTED", false, ["Stari grad"]]
  ] as const;

  const cleaners = await Promise.all(
    cleanerSeed.map(([email, name, verificationStatus, isActive, zones], index) => {
      const parts = nameParts(name);
      return prisma.user.create({
        data: {
          email,
          ...parts,
          name,
          phone: `+3816022233${index}`,
          passwordHash: cleanerHash,
          role: "CLEANER",
          status: verificationStatus === "REJECTED" ? "SUSPENDED" : "ACTIVE",
          cleanerProfile: {
            create: {
              bio: "Pouzdano, detaljno i diskretno održavanje stanova.",
              city: "Beograd",
              yearsExperience: index + 1,
              offeredServices:
                index % 2 === 0
                  ? "Redovno čišćenje, Standardno čišćenje, Pranje prozora"
                  : "Redovno čišćenje, Peglanje, Dubinsko čišćenje nameštaja",
              bringsSupplies: index % 2 === 0,
              bringsEquipment: index % 3 === 0,
              equipmentNote: index % 2 === 0 ? "Donosi osnovna sredstva i krpe." : "Radi sa sredstvima korisnika.",
              minHours: index % 3 === 0 ? 4 : 3,
              verificationStatus,
              identityVerified: verificationStatus === "VERIFIED",
              phoneVerified: verificationStatus !== "REJECTED",
              backgroundCheckStatus: verificationStatus === "VERIFIED" ? "PASSED" : "PENDING",
              isActive,
              payoutMethodNote: "Isplata jednom nedeljno.",
              internalRiskNote: verificationStatus === "REJECTED" ? "Nepotpuna dokumentacija u demo podacima." : null,
              zones: {
                create: zones.map((zone) => ({
                  city: "Beograd",
                  zone,
                  isActive: true
                }))
              },
              availability: {
                create: [1, 2, 3, 4, 5].map((day) => ({
                  dayOfWeek: day,
                  startTime: "09:00",
                  endTime: "17:00",
                  isActive: true
                }))
              }
            }
          }
        }
      });
    }
    )
  );

  const bookingSeed: Array<{
    customerIndex: number;
    cleanerIndex?: number;
    service: typeof regular | typeof standard;
    zone: string;
    address: string;
    squareMeters: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    days: number;
    start: string;
    recurrencePreference: RecurrencePreference;
    addOnCodes?: string[];
  }> = [
    { customerIndex: 0, service: regular, zone: "Vračar", address: "Bulevar kralja Aleksandra 52", squareMeters: 42, status: "REQUESTED", paymentStatus: "UNPAID", days: 2, start: "10:00", recurrencePreference: "ONE_TIME", addOnCodes: ["oven"] },
    { customerIndex: 1, cleanerIndex: 0, service: standard, zone: "Stari grad", address: "Kralja Petra 18", squareMeters: 63, status: "ASSIGNED", paymentStatus: "MANUAL_PENDING", days: 3, start: "09:00", recurrencePreference: "EVERY_TWO_WEEKS", addOnCodes: ["windows_inside"] },
    { customerIndex: 2, cleanerIndex: 1, service: regular, zone: "Novi Beograd", address: "Jurija Gagarina 144", squareMeters: 78, status: "CONFIRMED", paymentStatus: "PAID", days: 4, start: "12:00", recurrencePreference: "WEEKLY", addOnCodes: ["cleaning_supplies"] },
    { customerIndex: 0, cleanerIndex: 2, service: standard, zone: "Savski venac", address: "Kneza Miloša 40", squareMeters: 95, status: "COMPLETED", paymentStatus: "PAID", days: -6, start: "11:00", recurrencePreference: "MONTHLY", addOnCodes: ["fridge", "oven"] },
    { customerIndex: 1, cleanerIndex: 3, service: regular, zone: "Stari grad", address: "Dositejeva 7", squareMeters: 35, status: "DISPUTED", paymentStatus: "PAID", days: -3, start: "14:00", recurrencePreference: "ONE_TIME", addOnCodes: ["ironing"] },
    { customerIndex: 2, cleanerIndex: 4, service: standard, zone: "Novi Beograd", address: "Bulevar Zorana Đinđića 64", squareMeters: 118, status: "CANCELLED", paymentStatus: "REFUND_PENDING", days: -1, start: "10:00", recurrencePreference: "ONE_TIME" },
    { customerIndex: 0, service: regular, zone: "Vračar", address: "Njegoševa 31", squareMeters: 55, status: "MATCHING", paymentStatus: "PAID", days: 5, start: "15:00", recurrencePreference: "WEEKLY" },
    { customerIndex: 1, cleanerIndex: 2, service: regular, zone: "Savski venac", address: "Resavska 22", squareMeters: 45, status: "IN_PROGRESS", paymentStatus: "PAID", days: 0, start: "08:30", recurrencePreference: "ONE_TIME" },
    { customerIndex: 2, service: standard, zone: "Novi Beograd", address: "Omladinskih brigada 88", squareMeters: 130, status: "REQUESTED", paymentStatus: "UNPAID", days: 7, start: "13:00", recurrencePreference: "ONE_TIME", addOnCodes: ["windows_inside", "cleaning_supplies"] },
    { customerIndex: 0, cleanerIndex: 0, service: regular, zone: "Vračar", address: "Krunska 80", squareMeters: 68, status: "COMPLETED", paymentStatus: "PAID", days: -16, start: "09:30", recurrencePreference: "EVERY_TWO_WEEKS" }
  ];

  const bookings = [];
  for (const [index, item] of bookingSeed.entries()) {
    const selectedAddOns = addOns
      .filter((addOn) => item.addOnCodes?.includes(addOn.code))
      .map((addOn) => ({ code: addOn.code, priceRsd: addOn.priceRsd, quantity: addOn.code === "ironing" ? 2 : 1, id: addOn.id }));
    const price = calculatePrice({
      squareMeters: item.squareMeters,
      serviceType: item.service,
      addOns: selectedAddOns
    });

    const booking = await prisma.booking.create({
      data: {
        bookingCode: code(index + 1),
        customerId: customers[item.customerIndex].id,
        cleanerId: item.cleanerIndex === undefined ? null : cleaners[item.cleanerIndex].id,
        serviceTypeId: item.service.id,
        city: "Beograd",
        zone: item.zone,
        address: item.address,
        squareMeters: item.squareMeters,
        rooms: Math.max(1, Math.round(item.squareMeters / 35)),
        bathrooms: item.squareMeters > 80 ? 2 : 1,
        preferredDate: datePlus(item.days),
        preferredStartTime: item.start,
        estimatedHours: price.estimatedHours,
        customerNotes: "Demo zahtev iz seed podataka.",
        accessNotes: "Javiti se portiru ako postoji.",
        suppliesIncluded: selectedAddOns.some((addOn) => addOn.code === "cleaning_supplies"),
        status: item.status,
        paymentStatus: item.paymentStatus,
        recurrencePreference: item.recurrencePreference,
        requiresAdminConfirmation: price.requiresAdminConfirmation,
        subtotalRsd: price.subtotalRsd,
        bookingFeeRsd: price.bookingFeeRsd,
        totalPriceRsd: price.totalPriceRsd,
        cleanerPayoutRsd: price.cleanerPayoutRsd,
        platformRevenueRsd: price.platformRevenueRsd,
        cancellationReason: item.status === "CANCELLED" ? "Korisnik je promenio termin." : null,
        addOns: {
          create: selectedAddOns.map((addOn) => ({
            addOnId: addOn.id,
            quantity: addOn.quantity,
            priceRsd: addOn.priceRsd
          }))
        }
      }
    });
    bookings.push(booking);
  }

  await prisma.message.createMany({
    data: [
      { bookingId: bookings[1].id, senderId: customers[1].id, body: "Da li termin od 9h odgovara?" },
      { bookingId: bookings[1].id, senderId: cleaners[0].id, body: "Potvrđujem, vidimo se u 9h." },
      { bookingId: bookings[4].id, senderId: customers[1].id, body: "Imam primedbu na kuhinju, molim proveru." }
    ]
  });

  await prisma.review.createMany({
    data: [
      { bookingId: bookings[3].id, customerId: customers[0].id, cleanerId: cleaners[2].id, rating: 5, comment: "Odlično i temeljno." },
      { bookingId: bookings[9].id, customerId: customers[0].id, cleanerId: cleaners[0].id, rating: 4, comment: "Vrlo dobro, malo kašnjenje." }
    ]
  });

  await prisma.cleanerProfile.update({
    where: { userId: cleaners[2].id },
    data: { ratingAverage: 5, ratingCount: 1 }
  });
  await prisma.cleanerProfile.update({
    where: { userId: cleaners[0].id },
    data: { ratingAverage: 4, ratingCount: 1 }
  });

  const incident = await prisma.incidentReport.create({
    data: {
      bookingId: bookings[4].id,
      reportedByUserId: customers[1].id,
      type: "QUALITY_ISSUE",
      severity: "MEDIUM",
      description: "Korisnik prijavljuje da kuhinja nije očišćena po dogovoru.",
      status: "IN_REVIEW",
      resolutionNote: "Admin kontaktira obe strane.",
      refundAmountRsd: 1000
    }
  });

  await prisma.adminNote.createMany({
    data: [
      { entityType: "Booking", entityId: bookings[4].id, adminId: admin.id, note: "Ponuditi korektivni termin ili delimičan refund." },
      { entityType: "CleanerProfile", entityId: (await prisma.cleanerProfile.findUniqueOrThrow({ where: { userId: cleaners[7].id } })).id, adminId: admin.id, note: "Odbijen profil dok se ne dostave dokumenta." },
      { entityType: "User", entityId: customers[0].id, adminId: admin.id, note: "Rado bira jutarnje termine." }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      { actorUserId: admin.id, action: "SEED_CREATED", entityType: "System", entityId: "seed", metadata: JSON.stringify({ bookings: bookings.length }) },
      { actorUserId: admin.id, action: "INCIDENT_STATUS_CHANGED", entityType: "IncidentReport", entityId: incident.id, metadata: JSON.stringify({ status: "IN_REVIEW" }) },
      { actorUserId: admin.id, action: "CLEANER_VERIFIED", entityType: "CleanerProfile", entityId: "seed-cleaners", metadata: JSON.stringify({ count: 5 }) }
    ]
  });

  await prisma.notification.createMany({
    data: [
      { userId: customers[0].id, type: "BOOKING_REQUESTED", title: "Zahtev je primljen", body: "Admin tim proverava detalje za demo termin." },
      { userId: cleaners[0].id, type: "CLEANER_ASSIGNED", title: "Novi termin", body: "Dodeljen vam je demo termin u Starom gradu." },
      { userId: customers[2].id, type: "PAYMENT_PAID", title: "Uplata potvrđena", body: "Uplata za potvrđen termin je evidentirana." }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
    console.log("Admin: admin@cistodom.local / Admin123!");
    console.log("Customer: milica@demo.local / Korisnik123!");
    console.log("Cleaner: jelena@clean.local / Cistac123!");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
