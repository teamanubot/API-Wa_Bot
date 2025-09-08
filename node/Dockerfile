FROM node:20

RUN apt-get update && apt-get install -y \
  libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install express
RUN npm install axios
RUN npm install mime-types
RUN npm install basic-auth
RUN npm install dotenv
RUN npm install sharp

COPY . .

CMD ["node", "app.js"]
