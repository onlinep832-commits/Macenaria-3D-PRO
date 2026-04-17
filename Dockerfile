# Dockerfile para Planejador 3D
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g live-server
EXPOSE 8080
CMD ["live-server", "public", "--port=8080", "--host=0.0.0.0"]
