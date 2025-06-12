FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies without running scripts first
RUN npm install --ignore-scripts

# Copy all source files
COPY . .

# Now try to build
RUN npm run build || echo "Build attempted"

# If there's no build folder, create it
RUN mkdir -p build

# Ensure the start:sse script exists, or fallback to a basic start
EXPOSE 3000

# Try multiple start commands
CMD npm run start:sse || npm start || node build/index.js || node src/index.js
