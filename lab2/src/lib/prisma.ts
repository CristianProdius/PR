import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export type ProductCreateInput = Prisma.ProductCreateInput;
export type ProductUpdateInput = Prisma.ProductUpdateInput;

export interface ProductFilter {
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  availability?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const db = {
  product: {
    create: async (data: ProductCreateInput) => {
      return prisma.product.create({
        data: {
          ...data,
          currency: data.currency || "GBP",
        },
      });
    },

    update: async (id: number, data: ProductUpdateInput) => {
      return prisma.product.update({
        where: { id },
        data,
      });
    },

    delete: async (id: number) => {
      return prisma.product.delete({
        where: { id },
      });
    },

    findById: async (id: number) => {
      return prisma.product.findUnique({
        where: { id },
      });
    },

    findAll: async () => {
      return prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    findByName: async (name: string) => {
      return prisma.product.findMany({
        where: {
          name: {
            contains: name,
            mode: "insensitive",
          },
        },
      });
    },

    findFiltered: async (filter: ProductFilter) => {
      const where: Prisma.ProductWhereInput = {};

      if (filter.minPrice || filter.maxPrice) {
        where.price = {
          ...(filter.minPrice && { gte: filter.minPrice }),
          ...(filter.maxPrice && { lte: filter.maxPrice }),
        };
      }

      if (filter.currency) {
        where.currency = filter.currency;
      }

      if (filter.availability) {
        where.availability = filter.availability;
      }

      return prisma.product.findMany({
        where,
        orderBy: { price: "asc" },
      });
    },

    convertCurrency: async (fromCurrency: string, toCurrency: string) => {
      const GBP_TO_MDL_RATE = 23.12;

      if (fromCurrency === "GBP" && toCurrency === "MDL") {
        const products = await prisma.product.findMany({
          where: { currency: fromCurrency },
        });

        const updates = products.map((product) =>
          prisma.product.update({
            where: { id: product.id },
            data: {
              price: product.price * GBP_TO_MDL_RATE,
              currency: toCurrency,
            },
          })
        );

        await prisma.$transaction(updates);
      }
    },

    getTotalPrice: async (filter?: ProductFilter) => {
      const products = await db.product.findFiltered(filter || {});
      return products.reduce((sum, product) => sum + product.price, 0);
    },

    findWithPagination: async (
      page: number = 1,
      pageSize: number = 10
    ): Promise<PaginatedResult<Prisma.ProductGetPayload<{ select?: any }>>> => {
      const skip = (page - 1) * pageSize;
      const [total, data] = await prisma.$transaction([
        prisma.product.count(),
        prisma.product.findMany({
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        metadata: {
          total,
          totalPages,
          currentPage: page,
          pageSize,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    findByNamePaginated: async (
      name: string,
      page: number = 1,
      pageSize: number = 10
    ): Promise<PaginatedResult<Prisma.ProductGetPayload<{}>>> => {
      const where = {
        name: {
          contains: name,
          mode: "insensitive" as Prisma.QueryMode,
        },
      };

      const [total, data] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        metadata: {
          total,
          totalPages,
          currentPage: page,
          pageSize,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    findFilteredPaginated: async (
      filter: ProductFilter,
      page: number = 1,
      pageSize: number = 10
    ): Promise<PaginatedResult<Prisma.ProductGetPayload<{}>>> => {
      const where: Prisma.ProductWhereInput = {};

      if (filter.minPrice || filter.maxPrice) {
        where.price = {
          ...(filter.minPrice && { gte: filter.minPrice }),
          ...(filter.maxPrice && { lte: filter.maxPrice }),
        };
      }

      if (filter.currency) {
        where.currency = filter.currency;
      }

      if (filter.availability) {
        where.availability = filter.availability;
      }

      const [total, data] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { price: "asc" },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        data,
        metadata: {
          total,
          totalPages,
          currentPage: page,
          pageSize,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },

    count: async (filter?: ProductFilter) => {
      const where: Prisma.ProductWhereInput = {};

      if (filter) {
        if (filter.minPrice || filter.maxPrice) {
          where.price = {
            ...(filter.minPrice && { gte: filter.minPrice }),
            ...(filter.maxPrice && { lte: filter.maxPrice }),
          };
        }
        if (filter.currency) {
          where.currency = filter.currency;
        }
        if (filter.availability) {
          where.availability = filter.availability;
        }
      }

      return prisma.product.count({ where });
    },
  },
};

export default prisma;
