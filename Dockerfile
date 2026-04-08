# Usamos una imagen ligera de Nginx
FROM nginx:alpine

# Copiamos todos los archivos de nuestra carpeta actual al directorio de Nginx
COPY . /usr/share/nginx/html

# Exponemos el puerto 80 (puerto estándar web)
EXPOSE 80
