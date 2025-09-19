# Chatbot Widget Backend

## Descripción

API backend construida con **NestJS** que gestiona la lógica, procesamiento y almacenamiento de las conversaciones del asistente inteligente. Integra servicios de IA y bases de datos para ofrecer respuestas precisas y seguras. Incluye módulos desacoplados para RAG (Qdrant y OpenAI), persistencia con Prisma (PostgreSQL), y soporte para Redis.

---

## Tecnologías utilizadas

- **NestJS + TypeScript**
- **Prisma (PostgreSQL)**
- **Qdrant (Vector DB)**
- **OpenAI (LLM/Embeddings)**
- **Redis (Cache)**
- **Docker**
- **npm**

---

## Acceso

- **Backend API NestJS:** [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
backend/
├─ Dockerfile
├─ package.json
├─ tsconfig.json
├─ prisma/
│   ├─ schema.prisma
│   └─ migrations/
└─ src/
```

---

## Configuración de variables de entorno

Archivo `.env` (ejemplo):

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
LOG_LEVEL=info
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatbot_db"
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=replace_me
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=docs
RAG_TEST_MODE=false
RAG_MODE=qdrant
```

---

## Prisma: inicialización y migraciones

1. Instala Prisma:
   ```bash
   npm install prisma --save-dev
   npm install @prisma/client
   npx prisma generate
   ```
2. Crea el esquema en `prisma/schema.prisma`.
3. Ejecuta migraciones:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Comandos útiles:
   - `npx prisma generate`
   - `npx prisma migrate status`
   - `npx prisma studio`

---

## Docker Compose

Levanta el stack completo con:

```bash
docker compose up -d --build
```

---

## Contribución

1. Clona el repositorio
2. Configura tu archivo `.env`
3. Construye la imagen Docker con el `Dockerfile`
4. Inicializa Prisma y migraciones
5. Desarrolla nuevas funcionalidades en `backend/src`
6. Abre Pull Request y documenta los cambios

---

## Licencia

Este proyecto es **privado y de uso comercial**.  
Queda estrictamente prohibida la distribución, copia, modificación o uso total o parcial sin la autorización expresa y por escrito del titular.  
Para obtener acceso, soporte técnico o licencias comerciales, contacta a [MartiPE](mailto:martirspe@gmail.com).