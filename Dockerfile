# Utiliser l'image Node.js officielle
FROM node:24-alpine AS base

# Installer curl et wget pour les health checks et téléchargement de certificats
RUN apk add --no-cache curl wget

# Télécharger le certificat AWS DocumentDB CA
RUN wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O /tmp/global-bundle.pem

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Étape de build
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Étape de production
FROM base AS production

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les fichiers buildés
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Copier le certificat SSL
COPY --from=base /tmp/global-bundle.pem ./global-bundle.pem

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "dist/server.js"]