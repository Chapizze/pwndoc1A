#!/bin/bash

function usage {
    echo "Usage:        $0 -f [-h, --help]"
    echo ""
    echo "Options:"
    echo "  -h, --help  Display help"
    echo "  -f          Run full tests (Build with no cache)"
    exit 1
}

function full_test {
  # Check for docker-compose command
  DOCKER_COMPOSE_CMD=""

  if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
  elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
  else
    echo "Neither docker-compose nor docker compose is available on your system."
    exit 1
  fi

  # Stop services
  $DOCKER_COMPOSE_CMD -f docker-compose.yml stop

  # Remove Mongo data
  rm -rf backend/mongo-data

  # Start services
  $DOCKER_COMPOSE_CMD -f docker-compose.yml start

  # Build test images
  $DOCKER_COMPOSE_CMD -f backend/docker-compose.test.yml build

  # Run tests
  $DOCKER_COMPOSE_CMD -f backend/docker-compose.test.yml run --rm backend-test
  rc=$?

  # Exit with the result of the test run
  exit $rc
}

while getopts "hf" option
do
    case $option in
        h|--help)
            usage
            ;;
        f|--full)
            full_test
            ;;
        *)
            usage
            ;;
    esac
done
if [ $OPTIND -eq 1 ]; then usage; fi


