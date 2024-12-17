#!/bin/bash

# Ensure the script exits immediately if any command fails
set -e

# Color codes for formatting
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NC='\033[0m' # No Color

# Create resources directory if it doesn't exist
mkdir -p resources

# Function to print file contents with a label
print_file_contents() {
    echo -e "${YELLOW}Contents of $1:${NC}"
    cat "$1"
    echo -e "\n"
}

# Function to check if a file exists and has content
file_exists_and_not_empty() {
    if [[ -f "$1" ]] && [[ -s "$1" ]]; then
        return 0  # True in bash means file exists and is not empty
    else
        return 1  # False
    fi
}

# Generate cryptographic keys and salt
generate_keys() {
    # List of files to check
    local key_files=(
        "resources/key"
        "resources/salt"
        "resources/attachmentKey"
        "resources/attachmentIV"
    )

    # Check if any files already exist
    local existing_files=()
    for file in "${key_files[@]}"; do
        if file_exists_and_not_empty "$file"; then
            existing_files+=("$file")
        fi
    done

    # Prompt user if files exist
    if [[ ${#existing_files[@]} -gt 0 ]]; then
        echo -e "${YELLOW}Warning: The following key files already exist:${NC}"
        for file in "${existing_files[@]}"; do
            echo "- $file"
        done

        printf "${RED}Do you want to overwrite these files? Overwriting will make current findings data unaccessible as keys will change  (Y/N): ${NC}"
        read overwrite
        overwrite=$(echo "$overwrite" | tr '[:upper:]' '[:lower:]')
        
        if [[ "$overwrite" != "y" && "$overwrite" != "yes" ]]; then
            echo -e "${RED}Key generation cancelled.${NC}"
            return 0
        fi
    fi

    echo -e "${GREEN}Generating cryptographic keys...${NC}"
    
    # Generate a 32-byte hexadecimal random key
    openssl rand -hex 32 > resources/key
    print_file_contents resources/key

    # Generate a 16-digit random salt using only numbers
    tr -dc '0-9' < /dev/urandom | fold -w 16 | head -n 1 > resources/salt
    print_file_contents resources/salt

    # Generate a 32-byte base64 encoded attachment key
    openssl rand -base64 32 > resources/attachmentKey
    print_file_contents resources/attachmentKey

    # Generate a 16-byte base64 encoded attachment initialization vector
    openssl rand -base64 16 > resources/attachmentIV
    print_file_contents resources/attachmentIV

    # Set appropriate permissions (read-only for the owner)
    chmod 600 resources/key
    chmod 600 resources/salt
    chmod 600 resources/attachmentKey
    chmod 600 resources/attachmentIV
}

# Function to validate Yes/No input
validate_yes_no() {
    local input
    while true; do
        read -p "$1 (Y/N): " input
        input=$(echo "$input" | tr '[:upper:]' '[:lower:]')
        if [[ "$input" == "y" || "$input" == "yes" ]]; then
            return 0
        elif [[ "$input" == "n" || "$input" == "no" ]]; then
            return 1
        else
            echo -e "${RED}Invalid input. Please enter Y or N.${NC}"
        fi
    done
}

# Function to get SSO configuration
get_sso_config() {
    echo -e "${GREEN}SSO Configuration${NC}"
    
    # Ask about SSO
    if validate_yes_no "Do you want to configure SSO authentication?"; then
        # SSO Provider
        read -p "Enter SSO Provider (e.g., oidc): " PROVIDER
        PROVIDER=${PROVIDER:-oidc   }

        # Issuer
        read -p "Enter Issuer URL (e.g., https://exemple.com): " ISSUER
        ISSUER=${ISSUER:-"https://exemple.com"}

        # Authorization URL
        read -p "Enter Authorization URL (e.g., https://exemple.com/as/authorization.oauth2): " AUTH_URL
        AUTH_URL=${AUTH_URL:-"https://exemple.com/as/authorization.oauth2"}

        # Token URL
        read -p "Enter Token URL (e.g., https://exemple.com/as/token.oauth2): " TOKEN_URL
        TOKEN_URL=${TOKEN_URL:-"https://exemple.com/as/token.oauth2"}

        # UserInfo URL
        read -p "Enter UserInfo URL (e.g., https://exemple.com/idp/userinfo.openid): " USERINFO_URL
        USERINFO_URL=${USERINFO_URL:-"https://exemple.com/idp/userinfo.openid"}

        # Callback URL
        read -p "Enter Callback URL (e.g., https://myserverIP/api/sso): " CALLBACK_URL
        CALLBACK_URL=${CALLBACK_URL:-"https://myserverIP/api/sso"}

        # Scope
        read -p "Enter Scope (e.g., openid profile): " SCOPE
        SCOPE=${SCOPE:-"openid profile"}

        # Update backend config
        jq --arg provider "$PROVIDER" \
           --arg issuer "$ISSUER" \
           --arg authUrl "$AUTH_URL" \
           --arg tokenUrl "$TOKEN_URL" \
           --arg userInfoUrl "$USERINFO_URL" \
           --arg callbackUrl "$CALLBACK_URL" \
           --arg scope "$SCOPE" \
           '.dev.login.provider = "disabled" | 
            .prod.login = {
                "provider": $provider, 
                "issuer": $issuer, 
                "authorizationURL": $authUrl, 
                "tokenURL": $tokenUrl, 
                "userInfoURL": $userInfoUrl, 
                "callbackURL": $callbackUrl, 
                "scope": $scope
            } | 
            .test.login.provider = "disabled"' backend/src/config/config.json > temp.json && mv temp.json backend/src/config/config.json

        # Update frontend config
        jq '.isSSO = true' frontend/config/config.json > temp.json && mv temp.json frontend/config/config.json

        echo -e "${GREEN}SSO configuration completed successfully!${NC}"
    else
        # If no SSO, ensure configs are set to disabled/false
        jq '.dev.login.provider = "disabled" | .prod.login.provider = "disabled" | .test.login.provider = "disabled"' backend/src/config/config.json > temp.json && mv temp.json backend/src/config/config.json
        jq '.isSSO = false' frontend/config/config.json > temp.json && mv temp.json frontend/config/config.json

        echo -e "${YELLOW}SSO configuration skipped. Default settings applied.${NC}"
    fi
}

# Function to run_tests to check if everything is good and fill the database for faster setup

# Function to run tests and fill database
run_tests() {
    echo -e "${YELLOW}Preparing to run tests and fill database...${NC}"
    
    # Warning about database erasure
    echo -e "${RED}WARNING: Running tests will ERASE the current database. Proceed with caution!${NC}"
    
    if validate_yes_no "Do you want to continue and run tests to fill the database?"; then
        echo -e "${GREEN}Running tests and filling database...${NC}"
        
        # Run tests with force flag
        ./run_tests.sh -f
        
        # Check if tests were successful
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Tests completed successfully!${NC}"
            echo -e "${YELLOW}Admin Credentials:${NC}"
            echo -e "Username: ${GREEN}admin${NC}"
            echo -e "Password: ${GREEN}Adminpassword123${NC}"
        else
            echo -e "${RED}Tests failed. Please check the output above.${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Test and database filling skipped.${NC}"
    fi
}

# Function to deploy the application
deploy_app() {
    echo -e "${GREEN}Deployment Configuration${NC}"
    
    if validate_yes_no "Do you want to launch and deploy the application using Docker Compose?"; then
        echo -e "${YELLOW}Deploying application...${NC}"
        
        # Try docker compose first, fall back to docker-compose if needed
        if command -v docker &> /dev/null && docker compose version &> /dev/null; then
            docker compose -f docker-compose.yml up -d --build
        elif command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.yml up -d --build
        else
            echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found. Please install Docker Compose.${NC}"
            return 1
        fi
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Application deployed successfully!${NC}"

            echo -e "${GREEN}Application is accessible on https://localhost:8443"
        else
            echo -e "${RED}Deployment failed. Please check Docker Compose configuration.${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}Deployment skipped.${NC}"
    fi
}

# Main script execution
main() {
    # Generate cryptographic keys
    generate_keys

    # Configure SSO
    get_sso_config

    # Run tests and fill database
    run_tests

    # Deploy application
    deploy_app
}

# Run the main function
main
