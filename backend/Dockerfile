FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for heatmaps and uploads
RUN mkdir -p public/heatmaps tmp_uploads

EXPOSE 3001

CMD ["node", "server.js"]
