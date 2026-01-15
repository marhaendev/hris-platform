FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create auth directory if it doesn't exist
RUN mkdir -p auth_info_baileys

EXPOSE 3001

CMD ["npm", "start"]
