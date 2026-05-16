FROM node:20-alpine

WORKDIR /app

# package files eerst voor betere cache
COPY poc/poc/package*.json ./

# dependencies installeren
RUN npm ci

# rest van project kopiëren
COPY poc/poc/ .

# Angular dev server poort
EXPOSE 4200

# Angular bereikbaar maken buiten container
CMD ["npm", "start", "--", "--host", "0.0.0.0"]