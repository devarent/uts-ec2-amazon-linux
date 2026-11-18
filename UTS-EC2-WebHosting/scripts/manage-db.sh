#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script untuk switch antara Docker PostgreSQL dan AWS RDS
# ------------------------------------------------------------------
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="backups"

echo -e "${BLUE}=== Database Configuration Manager ===${NC}"
echo ""

# Function to check if RDS is configured
check_rds_config() {
    if [[ -f "$ENV_FILE" ]] && grep -q "^DATABASE_URL=.*rds.amazonaws.com" "$ENV_FILE"; then
        return 0  # RDS is configured
    else
        return 1  # Docker PostgreSQL is configured
    fi
}

# Function to backup current database
backup_current_db() {
    echo -e "${YELLOW}Creating backup of current database...${NC}"
    mkdir -p "$BACKUP_DIR"

    if check_rds_config; then
        # Backup from RDS
        source "$ENV_FILE"
        BACKUP_FILE="$BACKUP_DIR/rds-backup-$(date +%Y%m%d-%H%M%S).sql"
        echo -e "${BLUE}Backing up RDS database...${NC}"
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        echo -e "${GREEN}RDS backup created: $BACKUP_FILE${NC}"
    else
        # Backup from Docker PostgreSQL
        if docker compose --profile local-db ps db | grep -q "Up"; then
            BACKUP_FILE="$BACKUP_DIR/docker-backup-$(date +%Y%m%d-%H%M%S).sql"
            echo -e "${BLUE}Backing up Docker PostgreSQL...${NC}"
            docker compose --profile local-db exec -T db pg_dump -U "${POSTGRES_USER:-ec2lab}" "${POSTGRES_DB:-ec2lab}" > "$BACKUP_FILE"
            echo -e "${GREEN}Docker backup created: $BACKUP_FILE${NC}"
        else
            echo -e "${YELLOW}Docker database is not running, skipping backup${NC}"
        fi
    fi
}

# Function to show current configuration
show_current_config() {
    echo -e "${BLUE}Current Database Configuration:${NC}"
    if [[ -f "$ENV_FILE" ]]; then
        if check_rds_config; then
            echo -e "  ${GREEN}✓ Using AWS RDS PostgreSQL${NC}"
            grep "^DATABASE_URL=" "$ENV_FILE" | head -1
        else
            echo -e "  ${GREEN}✓ Using Docker PostgreSQL${NC}"
            if grep -q "^POSTGRES_DB=" "$ENV_FILE"; then
                grep "^POSTGRES_DB=" "$ENV_FILE"
                grep "^POSTGRES_USER=" "$ENV_FILE"
            fi
        fi
    else
        echo -e "  ${RED}✗ No .env file found${NC}"
    fi
    echo ""
}

# Function to configure for RDS
configure_rds() {
    echo -e "${YELLOW}Configuring for AWS RDS...${NC}"

    # Check if RDS endpoint is provided
    if [[ -z "${1:-}" ]]; then
        echo -e "${RED}Error: RDS endpoint is required${NC}"
        echo "Usage: $0 rds <rds-endpoint> <database-name> <username> <password>"
        echo "Example: $0 rds mydb.abc123.us-east-1.rds.amazonaws.com ec2lab ec2lab_admin MyPassword123!"
        exit 1
    fi

    local RDS_ENDPOINT="$1"
    local DB_NAME="${2:-ec2lab}"
    local DB_USER="${3:-ec2lab_admin}"
    local DB_PASSWORD="${4:-}"

    if [[ -z "$DB_PASSWORD" ]]; then
        echo -e "${YELLOW}Generating secure password...${NC}"
        if command -v openssl &> /dev/null; then
            DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
        else
            DB_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24)
        fi
        echo -e "${GREEN}Generated password: $DB_PASSWORD${NC}"
    fi

    # Create or update .env file
    if [[ ! -f "$ENV_FILE" ]]; then
        cp .env.example "$ENV_FILE"
    fi

    # Update DATABASE_URL for RDS
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
        # Update existing DATABASE_URL
        if command -v sed &> /dev/null; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}|" "$ENV_FILE"
        else
            perl -i -pe "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}|" "$ENV_FILE"
        fi
    else
        # Add DATABASE_URL
        echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/${DB_NAME}" >> "$ENV_FILE"
    fi

    # Add DATABASE_SSL for RDS
    if grep -q "^DATABASE_SSL=" "$ENV_FILE"; then
        if command -v sed &> /dev/null; then
            sed -i "s|^DATABASE_SSL=.*|DATABASE_SSL=true|" "$ENV_FILE"
        else
            perl -i -pe "s|^DATABASE_SSL=.*|DATABASE_SSL=true|" "$ENV_FILE"
        fi
    else
        echo "DATABASE_SSL=true" >> "$ENV_FILE"
    fi

    echo -e "${GREEN}✓ Configured for AWS RDS${NC}"
    echo -e "  Endpoint: $RDS_ENDPOINT"
    echo -e "  Database: $DB_NAME"
    echo -e "  User: $DB_USER"
    echo -e "  Password: $DB_PASSWORD"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update docker-compose.yml to remove 'db' service"
    echo "2. Run: docker compose up -d"
    echo "3. Test connection: docker compose exec app node -e \"require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(()=>console.log('Connected')).catch(e=>console.error(e))\""
}

# Function to configure for Docker PostgreSQL
configure_docker() {
    echo -e "${YELLOW}Configuring for Docker PostgreSQL...${NC}"

    # Create or update .env file
    if [[ ! -f "$ENV_FILE" ]]; then
        cp .env.example "$ENV_FILE"
    fi

    # Get or generate Docker PostgreSQL credentials
    local DB_NAME="ec2lab"
    local DB_USER="ec2lab"
    local DB_PASSWORD=""

    if grep -q "^POSTGRES_DB=" "$ENV_FILE"; then
        DB_NAME=$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d'=' -f2)
    fi

    if grep -q "^POSTGRES_USER=" "$ENV_FILE"; then
        DB_USER=$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d'=' -f2)
    fi

    if grep -q "^POSTGRES_PASSWORD=" "$ENV_FILE"; then
        DB_PASSWORD=$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
    else
        echo -e "${YELLOW}Generating secure password...${NC}"
        if command -v openssl &> /dev/null; then
            DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
        else
            DB_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 24)
        fi
        echo "POSTGRES_PASSWORD=$DB_PASSWORD" >> "$ENV_FILE"
        echo -e "${GREEN}Generated password: $DB_PASSWORD${NC}"
    fi

    # Update DATABASE_URL for Docker PostgreSQL
    local DOCKER_DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
        if command -v sed &> /dev/null; then
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DOCKER_DATABASE_URL}|" "$ENV_FILE"
        else
            perl -i -pe "s|^DATABASE_URL=.*|DATABASE_URL=${DOCKER_DATABASE_URL}|" "$ENV_FILE"
        fi
    else
        echo "DATABASE_URL=${DOCKER_DATABASE_URL}" >> "$ENV_FILE"
    fi

    # Remove DATABASE_SSL for Docker
    if grep -q "^DATABASE_SSL=" "$ENV_FILE"; then
        if command -v sed &> /dev/null; then
            sed -i "/^DATABASE_SSL=/d" "$ENV_FILE"
        else
            perl -i -ne "print unless /^DATABASE_SSL=/" "$ENV_FILE"
        fi
    fi

    echo -e "${GREEN}✓ Configured for Docker PostgreSQL${NC}"
    echo -e "  Database: $DB_NAME"
    echo -e "  User: $DB_USER"
    echo -e "  Password: $DB_PASSWORD"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Ensure docker-compose.yml has 'db' service"
    echo "2. Run: docker compose up -d db app"
    echo "3. Test connection: docker compose exec db psql -U $DB_USER -d $DB_NAME -c 'SELECT version();'"
}

# Function to test database connection
test_connection() {
    echo -e "${BLUE}Testing database connection...${NC}"

    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}Error: .env file not found${NC}"
        exit 1
    fi

    # Load environment variables
    export $(grep -v '^#' "$ENV_FILE" | xargs)

    if [[ -z "${DATABASE_URL:-}" ]]; then
        echo -e "${RED}Error: DATABASE_URL not set${NC}"
        exit 1
    fi

    echo -e "${BLUE}Connection string: ${DATABASE_URL:0:50}...${NC}"

    # Test connection using psql if available
    if command -v psql &> /dev/null; then
        echo -e "${BLUE}Testing with psql...${NC}"
        if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
            echo -e "${GREEN}✓ Connection successful (psql)${NC}"
        else
            echo -e "${RED}✗ Connection failed (psql)${NC}"
        fi
    fi

    # Test connection using Docker if available
    if command -v docker &> /dev/null; then
        echo -e "${BLUE}Testing with Docker...${NC}"
        if docker run --rm -e DATABASE_URL="$DATABASE_URL" postgres:17-alpine \
            psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
            echo -e "${GREEN}✓ Connection successful (Docker)${NC}"
        else
            echo -e "${RED}✗ Connection failed (Docker)${NC}"
        fi
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status          Show current database configuration"
    echo "  backup          Backup current database"
    echo "  rds <endpoint>  Configure for AWS RDS"
    echo "                  Arguments: <endpoint> [database] [user] [password]"
    echo "  docker          Configure for Docker PostgreSQL"
    echo "  test            Test database connection"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 backup"
    echo "  $0 rds mydb.abc123.us-east-1.rds.amazonaws.com ec2lab ec2lab_admin MyPassword123!"
    echo "  $0 docker"
    echo "  $0 test"
    echo ""
    echo "Environment variables:"
    echo "  ENV_FILE         Path to .env file (default: .env)"
    echo "  BACKUP_DIR       Path to backup directory (default: backups)"
}

# Main script logic
case "${1:-help}" in
    status)
        show_current_config
        ;;
    backup)
        backup_current_db
        ;;
    rds)
        shift
        configure_rds "$@"
        ;;
    docker)
        configure_docker
        ;;
    test)
        test_connection
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
