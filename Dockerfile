# define from what image we want to build from
FROM node:8

# Create app directory
WORKDIR /usr/src/app    

# Install app dependencies
# вместо копирования всего рабочего каталога мы копируем только package.json файл. 
# Это позволяет нам использовать кэшированные слои Docker. 
COPY package*.json ./

RUN npm install

# Bundle app source
# связать исходный код вашего приложения внутри образа Docker
COPY . .

EXPOSE 8080  


# команда для запуска приложения
CMD [ "npm", "start" ]


  