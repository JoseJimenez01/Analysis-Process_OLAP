FROM node:22-alpine

WORKDIR /app

# Copiar manifiestos de todos los workspaces para aprovechar cache de capas
COPY package.json package-lock.json ./
COPY services/api/package.json services/api/
COPY services/search/package.json services/search/
RUN npm ci

# Copiar el resto del código fuente
COPY . .

EXPOSE 4000

CMD ["npm", "--workspace", "services/search", "run", "start"]
