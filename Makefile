.PHONY: dev test seed verify journeys journey-docker

dev:
	docker compose up --build

test:
	pytest backend/tests -v

seed:
	plx simulate --scenario happy_path --count 1

verify:
	plx verify

journeys:
	python scripts/journeys/journey_stranger.py
	python scripts/journeys/journey_dev.py
	bash scripts/journeys/journey_agent.sh
	python scripts/journeys/journey_operator.py
	python scripts/journeys/journey_auditor.py

journey-docker:
	bash scripts/journeys/journey_selfhost.sh
