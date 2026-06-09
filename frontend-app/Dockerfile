# Multi-stage build for Angular frontend
FROM node:20-alpine AS build
WORKDIR /app

# Copy package configurations and perform clean dependency install
COPY package*.json ./
RUN npm ci

# Copy project files and build production static bundle
COPY . .
RUN npm run build -- --configuration=production

# Final runtime image utilizing nginx-alpine
FROM nginx:1.25-alpine

# Clean default configuration and copy custom spa configuration
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled build output files
COPY --from=build /app/dist/alaya-core-pms-frontend/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
