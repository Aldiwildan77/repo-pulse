.PHONY: dev dev-backend dev-frontend infra lint lint-fix start build

dev: dev-backend dev-frontend

infra:
	docker compose -f docker/docker-compose.yml up -d

dev-backend:
	cd backend && pnpm dev &

dev-frontend:
	cd frontend && pnpm dev &

lint:
	cd backend && pnpm tsc --noEmit
	cd frontend && pnpm lint

lint-fix:
	cd frontend && pnpm lint --fix

start: infra
	cd backend && pnpm start &
	cd frontend && pnpm preview &

build:
	cd backend && pnpm build
	cd frontend && pnpm build
