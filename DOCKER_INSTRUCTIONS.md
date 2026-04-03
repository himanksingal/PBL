# Docker Instructions

This guide explains how to build, push, pull, and run the application using Docker on another system.

## 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.
- A [Docker Hub](https://hub.docker.com/) account.

## 2. Build and Push Images (On Development Machine)

1.  **Build the images**:
    ```bash
    docker-compose build
    ```

2.  **Tag the images**:
    Replace `yourusername` with your Docker Hub username.
    ```bash
    docker tag pbl-backend yourusername/muj-portal-backend:latest
    docker tag pbl-frontend yourusername/muj-portal-frontend:latest
    ```
    *Note: Check `docker images` to find the exact image ID or name if `pbl-backend` is not found. It usually defaults to `directoryname_service`.*

3.  **Login to Docker Hub**:
    ```bash
    docker login
    ```

4.  **Push the images**:
    ```bash
    docker push yourusername/muj-portal-backend:latest
    docker push yourusername/muj-portal-frontend:latest
    ```

## 3. Run on Another System (Deployment)

On the target system, you do **not** need the full codebase. You only need the `docker-compose.yml` file.

1.  **Copy `docker-compose.yml`** to the target machine.

2.  **Edit `docker-compose.yml`**:
    Replace the `build: ...` sections with the image names you pushed.

    ```yaml
    version: '3.8'

    services:
      backend:
        image: yourusername/muj-portal-backend:latest  # Changed from build
        ports:
          - "5001:5001"
        environment:
          - PORT=5001
          - MONGODB_URI=mongodb://mongo:27017/muj-portal
          - FRONTEND_URL=http://localhost:5173
        depends_on:
          - mongo
        networks:
          - app-network

      frontend:
        image: yourusername/muj-portal-frontend:latest  # Changed from build
        ports:
          - "5173:5173"
        environment:
          - VITE_API_URL=http://localhost:5001/api
        depends_on:
          - backend
        networks:
          - app-network

      mongo:
        image: mongo:latest
        ports:
          - "27017:27017"
        volumes:
          - mongo-data:/data/db
        networks:
          - app-network

    networks:
      app-network:
        driver: bridge

    volumes:
      mongo-data:
    ```

3.  **Run the application**:
    ```bash
    docker-compose up -d
    ```

4.  **Access the application**:
    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:5001`
