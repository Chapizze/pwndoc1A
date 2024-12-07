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
    docker-compose -f docker-compose.yml stop
    rm -rf backend/mongo-data
    docker-compose -f docker-compose.yml start
    docker-compose -f backend/docker-compose.test.yml build
    docker-compose -f backend/docker-compose.test.yml run --rm backend-test
    rc=$?
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


