FROM mhart/alpine-node:6.10.2
RUN mkdir -p /app
ADD package.json /app/package.json
RUN cd /app && npm install
ADD . /app
WORKDIR /app
RUN rm -fr build && bin/build && ./node_modules/.bin/tsc -p tsconfig.json

EXPOSE 3000
ENTRYPOINT ["bin/epoxy"]
