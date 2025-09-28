FROM node:18-alpine

WORKDIR /app

# Install deps first
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

EXPOSE 5173

# Dev server with hot reload and host binding
CMD ["npm", "run", "dev", "--", "--host"]
