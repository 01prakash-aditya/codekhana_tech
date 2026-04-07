FROM --platform=linux/amd64 node:24

# Install compilers and runtime dependencies from Debian repos.
RUN apt-get update && \
    apt-get install -y --no-install-recommends g++ python3 python3-pip openjdk-17-jdk && \
    rm -rf /var/lib/apt/lists/*

# Set Java environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install -g nodemon && npm install

COPY . .

EXPOSE 8000
CMD ["npx", "nodemon", "index.js"]
