FROM node:20

# Establecer directorio de trabajo
WORKDIR /home/motowork-blog

# Copiar y instalar solo las dependencias
COPY package*.json ./
RUN npm cache clean --force && npm install

# Instalar nodemon y ts-node como globales para hot-reload
RUN npm install -g nodemon ts-node

# Exponer el puerto
EXPOSE 3075

# Comando para iniciar la aplicación con hot-reload
CMD ["nodemon", "--legacy-watch", "src/app.ts"]
