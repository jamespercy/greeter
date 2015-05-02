FROM google/nodejs
MAINTAINER james

WORKDIR /app
ADD package.json /app/
RUN npm install
ADD . /app

EXPOSE 3000
CMD []
ENTRYPOINT ["/nodejs/bin/node", "greeter.js"]
