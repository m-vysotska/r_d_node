# Docker Compose backend (NestJS + Postgres)

Prod-like та dev запуск через Docker Compose, multi-stage Dockerfile з targets dev/build/prod/prod-distroless, міграції та seed як one-off контейнери.

## Що в репозиторії

| Файл | Призначення |
|------|-------------|
| `Dockerfile` | Multi-stage: deps, build, dev, prod, migrate, seed, prod-distroless |
| `compose.yml` | Prod-like стек: api (prod), postgres, migrate/seed (one-off, profile tools) |
| `compose.dev.yml` | Override для dev: api з target dev, bind-mount коду, hot reload |
| `.dockerignore` | Виключення node_modules, dist, .env, тестів із образу |
| `.env.example` | Приклад змінних без секретів |

## Передумови

- Docker і Docker Compose
- Для збірки: у проєкті має бути `package-lock.json` (якщо клонували порожній репо — виконайте `npm install` або `npm install --legacy-peer-deps` один раз).

## Команди запуску

### Dev (hot reload, bind-mount)

```bash
cp .env.example .env
# Відредагуйте .env при потребі (DB_PASSWORD тощо)

docker compose -f compose.yml -f compose.dev.yml up --build
```

API: http://localhost:8080 (health: http://localhost:8080/health).  
Код монтується в контейнер, зміни підхоплюються без перезбірки образу. `node_modules` зберігаються за рахунок анонімного volume `/app/node_modules`.

### Prod-like локально

```bash
cp .env.example .env

# Міграції та seed (one-off)
docker compose --profile tools run --rm migrate
docker compose --profile tools run --rm seed

# Запуск стеку
docker compose up --build
```

API: http://localhost:8080.  
Postgres не експонується назовні (немає `ports:`), лише внутрішня мережа.

### Запуск з образом prod-distroless

Збірка та запуск api з target prod-distroless:

```bash
docker compose build --build-arg BUILDKIT_INLINE_CACHE=1 api
# У compose.yml змініть target для api на prod-distroless або запустіть один контейнер:
docker build --target prod-distroless -t hw_docker-api:distroless .
docker run --rm --network hw_docker_internal -e DB_HOST=postgres -e DB_PASSWORD=... -p 8080:3000 hw_docker-api:distroless
```

Або додайте у `compose.yml` окремий сервіс з `target: prod-distroless` і запускайте його замість звичайного api.

## Міграції та seed

- **Міграції** (one-off):  
  `docker compose --profile tools run --rm migrate`
- **Seed** (one-off):  
  `docker compose --profile tools run --rm seed`

Сервіси migrate і seed мають profile `tools`, тому не стартують при `docker compose up`. Postgres має healthcheck; migrate/seed підключаються до postgres по внутрішній мережі.

## Докази оптимізації образів

Порівняння розмірів (після збірки):

```bash
docker compose build --no-cache 2>/dev/null
docker image ls | grep hw_docker
```

Приклад виводу (орієнтовно):

| IMAGE | SIZE |
|-------|------|
| hw_docker-api (dev) | ~500MB+ (node_modules + devDependencies) |
| hw_docker-api (prod) | ~200MB (alpine + prod deps + dist) |
| hw_docker-api (prod-distroless) | ~150MB (distroless + node_modules prod + dist) |

Історія шарів:

```bash
docker history hw_docker-api:latest
docker history <image-prod-distroless>
```

**Чому prod-distroless менший і безпечніший:**

- Базовий образ distroless мінімальний: без shell, пакетного менеджера, зайвих бінарників.
- Менша поверхня атаки та менше шарів.
- Образ `nonroot` — процес не працює від root.

## Перевірка non-root

**prod (alpine):** контейнер запускається під користувачем `node` (uid 1000):

```bash
docker compose run --rm api id
# uid=1000(node) gid=1000(node)
```

**prod-distroless:** використовується образ `gcr.io/distroless/nodejs22-debian12:nonroot` і `USER nonroot:nonroot` у Dockerfile — процес у контейнері не root, гарантовано через базовий distroless nonroot образ.

## Секрети та конфіг

- Секрети (JWT, DB_PASSWORD тощо) не хардкодяться в compose/Dockerfile.
- Використовується `env_file: .env` та змінні середовища у `compose.yml` (значення з `.env` або дефолти).
- Файл `.env` не комітиться; у репозиторі є лише `.env.example`.

## Структура Dockerfile (targets)

| Target | Призначення |
|--------|-------------|
| deps | Залежності (`npm ci`) |
| build | Збірка TS (`npm run build`) |
| dev | Режим розробки, hot reload |
| prod | Runtime на Alpine, USER node, лише dist + prod node_modules |
| migrate | One-off: TypeORM migration:run |
| seed | One-off: node dist/seed.js |
| prod-distroless | Runtime на distroless/nodejs22:nonroot, без shell |
