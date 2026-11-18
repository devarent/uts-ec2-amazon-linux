#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script untuk update docker-compose.yml berdasarkan database configuration
# ------------------------------------------------------------------
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.yml"
BACKUP_FILE="docker-compose.yml.backup"

echo -e "${BLUE}=== Docker Compose Configuration Updater ===${NC}"
echo ""

# Function to check if using RDS
check_using_rds() {
    if [[ -f ".env" ]] && grep -q "^DATABASE_URL=.*rds.amazonaws.com" ".env"; then
        return 0  # Using RDS
    else
        return 1  # Using Docker PostgreSQL
    fi
}

# Function to create backup
create_backup() {
    if [[ -f "$COMPOSE_FILE" ]]; then
        cp "$COMPOSE_FILE" "$BACKUP_FILE"
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    fi
}

# Function to restore from backup
restore_backup() {
    if [[ -f "$BACKUP_FILE" ]]; then
        cp "$BACKUP_FILE" "$COMPOSE_FILE"
        echo -e "${GREEN}✓ Restored from backup: $BACKUP_FILE${NC}"
        rm "$BACKUP_FILE"
    else
        echo -e "${RED}✗ No backup file found${NC}"
    fi
}

# Function to configure for RDS (remove db service)
configure_for_rds() {
    echo -e "${YELLOW}Configuring docker-compose.yml for AWS RDS...${NC}"

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
        exit 1
    fi

    create_backup

    # Use Python to modify YAML safely
    python3 << 'EOF'
import yaml
import sys

try:
    with open('docker-compose.yml', 'r') as f:
        compose = yaml.safe_load(f)
    
    # Remove db service if it exists (or keep it but ensure it's optional)
    if 'services' in compose and 'db' in compose['services']:
        # Add profile to make it optional
        if 'profiles' not in compose['services']['db']:
            compose['services']['db']['profiles'] = ['local-db']
            print("✓ Added 'local-db' profile to db service")
        else:
            print("✓ db service already has profile")
    
    # Update app service to not depend on db when using RDS
    if 'services' in compose and 'app' in compose['services']:
        app_service = compose['services']['app']
        
        # Make db dependency optional
        if 'depends_on' in app_service and 'db' in app_service['depends_on']:
            if isinstance(app_service['depends_on']['db'], dict):
                app_service['depends_on']['db']['required'] = False
            elif isinstance(app_service['depends_on']['db'], str):
                # Convert string to dict with required: false
                app_service['depends_on']['db'] = {
                    'condition': 'service_healthy',
                    'required': False
                }
            print("✓ Made db dependency optional for app service")
        
        # Add DATABASE_SSL environment variable
        if 'environment' not in app_service:
            app_service['environment'] = {}
        
        # Handle environment as dict or list
        if isinstance(app_service['environment'], dict):
            app_service['environment']['DATABASE_SSL'] = 'true'
        elif isinstance(app_service['environment'], list):
            # Convert list to dict for easier manipulation
            env_dict = {}
            for env_item in app_service['environment']:
                if '=' in env_item:
                    key, value = env_item.split('=', 1)
                    env_dict[key] = value
            env_dict['DATABASE_SSL'] = 'true'
            app_service['environment'] = env_dict
        
        print("✓ Added DATABASE_SSL=true to app environment")
    
    # Write back to file
    with open('docker-compose.yml', 'w') as f:
        yaml.dump(compose, f, default_flow_style=False, sort_keys=False)
    
    print("✓ docker-compose.yml updated for RDS")
    
except Exception as e:
    print(f"✗ Error updating docker-compose.yml: {e}", file=sys.stderr)
    sys.exit(1)
EOF

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ docker-compose.yml configured for AWS RDS${NC}"
        echo ""
        echo -e "${YELLOW}Changes made:${NC}"
        echo "  - Made db service optional (profile: local-db)"
        echo "  - Made db dependency optional for app"
        echo "  - Added DATABASE_SSL=true to app"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Review the changes: cat docker-compose.yml"
        echo "2. Deploy: docker compose up -d app"
        echo "3. Test connection: docker compose exec app node -e \"require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(()=>console.log('Connected')).catch(e=>console.error(e))\""
    else
        echo -e "${RED}✗ Failed to update docker-compose.yml${NC}"
        echo -e "${YELLOW}Restoring from backup...${NC}"
        restore_backup
        exit 1
    fi
}

# Function to configure for Docker PostgreSQL (make db service required)
configure_for_docker() {
    echo -e "${YELLOW}Configuring docker-compose.yml for Docker PostgreSQL...${NC}"

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
        exit 1
    fi

    # Check if we have a backup to restore
    if [[ -f "$BACKUP_FILE" ]]; then
        echo -e "${BLUE}Found backup file, restoring...${NC}"
        restore_backup
        echo -e "${GREEN}✓ Restored original docker-compose.yml${NC}"
        return 0
    fi

    # If no backup, we need to update the db service to be required
    echo -e "${YELLOW}No backup found. Updating Docker PostgreSQL configuration...${NC}"

    # Use Python to modify YAML safely
    python3 << 'EOF'
import yaml
import sys

try:
    with open('docker-compose.yml', 'r') as f:
        compose = yaml.safe_load(f)
    
    # Add db service if it doesn't exist
    if 'services' not in compose:
        compose['services'] = {}
    
    if 'db' not in compose['services']:
        compose['services']['db'] = {
            'image': 'postgres:17-alpine',
            'container_name': 'ec2-lab-db',
            'restart': 'unless-stopped',
            'environment': {
                'POSTGRES_DB': '${POSTGRES_DB:-ec2lab}',
                'POSTGRES_USER': '${POSTGRES_USER:-ec2lab}',
                'POSTGRES_PASSWORD': '${POSTGRES_PASSWORD:-ec2lab_dev_password}',
                'PGDATA': '/var/lib/postgresql/data/pgdata'
            },
            'ports': [
                '127.0.0.1:5433:5432'
            ],
            'volumes': [
                'db-data:/var/lib/postgresql/data',
                './db/init:/docker-entrypoint-initdb.d:ro'
            ],
            'healthcheck': {
                'test': ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}'],
                'interval': '10s',
                'timeout': '5s',
                'retries': 6,
                'start_period': '20s'
            },
            'security_opt': [
                'no-new-privileges:true'
            ],
            'logging': {
                'driver': 'json-file',
                'options': {
                    'max-size': '10m',
                    'max-file': '3'
                }
            },
            'networks': ['edge']
        }
        print("✓ Added 'db' service")
    else:
        # Remove profile to make it always start
        if 'profiles' in compose['services']['db']:
            del compose['services']['db']['profiles']
            print("✓ Removed 'local-db' profile from db service")
    
    # Add db-data volume if it doesn't exist
    if 'volumes' not in compose:
        compose['volumes'] = {}
    
    if 'db-data' not in compose['volumes']:
        compose['volumes']['db-data'] = {}
        print("✓ Added 'db-data' volume")
    
    # Update app service to depend on db
    if 'services' in compose and 'app' in compose['services']:
        app_service = compose['services']['app']
        
        # Add depends_on db
        if 'depends_on' not in app_service:
            app_service['depends_on'] = {}
        
        if isinstance(app_service['depends_on'], dict):
            app_service['depends_on']['db'] = {
                'condition': 'service_healthy',
                'required': True
            }
        elif isinstance(app_service['depends_on'], list):
            if 'db' not in app_service['depends_on']:
                app_service['depends_on'].append('db')
        
        print("✓ Added 'db' dependency to app service")
        
        # Remove DATABASE_SSL for Docker
        if 'environment' in app_service:
            if isinstance(app_service['environment'], dict):
                if 'DATABASE_SSL' in app_service['environment']:
                    del app_service['environment']['DATABASE_SSL']
                    print("✓ Removed DATABASE_SSL from app environment")
            elif isinstance(app_service['environment'], list):
                # Convert to dict, remove DATABASE_SSL, convert back
                env_dict = {}
                for env_item in app_service['environment']:
                    if '=' in env_item:
                        key, value = env_item.split('=', 1)
                        if key != 'DATABASE_SSL':
                            env_dict[key] = value
                app_service['environment'] = env_dict
                print("✓ Removed DATABASE_SSL from app environment")
    
    # Write back to file
    with open('docker-compose.yml', 'w') as f:
        yaml.dump(compose, f, default_flow_style=False, sort_keys=False)
    
    print("✓ docker-compose.yml updated for Docker PostgreSQL")
    
except Exception as e:
    print(f"✗ Error updating docker-compose.yml: {e}", file=sys.stderr)
    sys.exit(1)
EOF

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ docker-compose.yml configured for Docker PostgreSQL${NC}"
        echo ""
        echo -e "${YELLOW}Changes made:${NC}"
        echo "  - Made db service required (removed profile)"
        echo "  - Made db dependency required for app"
        echo "  - Removed DATABASE_SSL from app"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Review the changes: cat docker-compose.yml"
        echo "2. Deploy: docker compose up -d"
        echo "3. Test connection: docker compose exec db psql -U ec2lab -d ec2lab -c 'SELECT version();'"
    else
        echo -e "${RED}✗ Failed to update docker-compose.yml${NC}"
        exit 1
    fi
}

# Function to validate docker-compose.yml
validate_compose() {
    echo -e "${BLUE}Validating docker-compose.yml...${NC}"
    
    if docker compose config &> /dev/null; then
        echo -e "${GREEN}✓ docker-compose.yml is valid${NC}"
        return 0
    else
        echo -e "${RED}✗ docker-compose.yml has errors${NC}"
        docker compose config
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  status      Show current configuration"
    echo "  rds         Configure for AWS RDS (makes db service optional)"
    echo "  docker      Configure for Docker PostgreSQL (makes db service required)"
    echo "  restore     Restore from backup"
    echo "  validate    Validate docker-compose.yml"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 rds      # After configuring RDS in .env"
    echo "  $0 docker   # To switch back to Docker PostgreSQL"
    echo "  $0 restore  # Restore original configuration"
    echo "  $0 validate # Check if configuration is valid"
}

# Main script logic
case "${1:-help}" in
    status)
        echo -e "${BLUE}Current Configuration:${NC}"
        if check_using_rds; then
            echo -e "  ${GREEN}✓ Using AWS RDS${NC}"
            echo -e "  ${YELLOW}docker-compose.yml should have db service with 'local-db' profile${NC}"
        else
            echo -e "  ${GREEN}✓ Using Docker PostgreSQL${NC}"
            echo -e "  ${YELLOW}docker-compose.yml should have db service without profile (always runs)${NC}"
        fi
        echo ""
        echo -e "${BLUE}docker-compose.yml services:${NC}"
        if [[ -f "$COMPOSE_FILE" ]]; then
            if command -v docker &> /dev/null; then
                docker compose config --services 2>/dev/null || echo "  (Unable to parse services)"
                echo ""
                echo -e "${BLUE}Profiles:${NC}"
                docker compose config --profiles 2>/dev/null || echo "  (No profiles or unable to parse)"
            else
                echo "  (Docker not available)"
            fi
        else
            echo -e "  ${RED}✗ $COMPOSE_FILE not found${NC}"
        fi
        ;;
    rds)
        configure_for_rds
        ;;
    docker)
        configure_for_docker
        ;;
    restore)
        restore_backup
        ;;
    validate)
        validate_compose
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
