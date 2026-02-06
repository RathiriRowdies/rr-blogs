# Simple static web server
FROM nginx:alpine

# Copy your static site into Nginx default public folder
COPY . /usr/share/nginx/html

# Optional: SPA routing (only if you use client-side routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
