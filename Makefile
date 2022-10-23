mock-db:
	@docker-compose up -d
	@timeout 90s bash -c "until docker exec postgres-cms-api pg_isready ; do sleep 5 ; done"

mockup: mock-db
	@set -e; \
		. ./mock.sh; \
	npm start

run:
	@set -e; \
		. ./local.sh
	npm start