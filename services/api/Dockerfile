FROM node:22-alpine

WORKDIR /app

# Copiar manifiestos de todos los workspaces para aprovechar cache de capas
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY services/search/package.json services/search/
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Prisma 7 requiere DATABASE_URL también para `prisma generate`
ARG DATABASE_URL=postgresql://postgres:postgres@postgres:5432/restaurantes
ENV DATABASE_URL=${DATABASE_URL}

# Generar Prisma Client para que esté disponible en runtime
RUN npm --workspace services/api run prisma:generate

EXPOSE 3000

# Script de inicio: resolver migraciones fallidas, aplicar pendientes, iniciar
CMD ["sh", "-c", "\
  npx prisma migrate resolve --applied 001_initial 2>/dev/null || true && \
  npm --workspace services/api run prisma:deploy && \
  npm --workspace services/api run start \
"]
