# Database Setup Guide

This project uses PostgreSQL 17 with Docker Compose for both local development and EC2 production deployment.

## Quick Start

### 1. Initialize Database Configuration

Run the setup script to generate secure credentials:

```bash
# Linux/Mac
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh

# Windows (Git Bash)
bash scripts/setup-db.sh
```

This will:
- Generate a secure database password
- Generate an admin token for the API
- Update the `.env` file with new values

### 2. Start the Database

Docker PostgreSQL runs by default. When using RDS, the `docker-compose.rds.yml`
override puts the local database service behind an inactive profile.

**For local development with Docker PostgreSQL:**
```bash
docker compose up -d db
```

**For AWS RDS (external database):**
```bash
# Configure DATABASE_URL and DATABASE_SSL=true in .env first
docker compose -f docker-compose.yml -f docker-compose.rds.yml up -d app
```

### 3. Verify Database Connection

```bash
# Run the check script
bash scripts/check-db.sh

# Or manually connect
docker compose exec db psql -U ec2lab -d ec2lab
```

## Database Schema

The database is automatically initialized with the schema from `db/init/001-schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS guestbook (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guestbook_created_at_idx
  ON guestbook (created_at DESC, id DESC);

-- app_users, app_sessions, and deployment_progress are created as well.
```

## Accessing the Database

### From the Application

The Next.js app connects via the `DATABASE_URL` environment variable:

```
postgres://ec2lab:YOUR_PASSWORD@db:5432/ec2lab
```

### From Your Machine

**Via psql:**
```bash
docker compose exec db psql -U ec2lab -d ec2lab
```

**Via Adminer (Web UI):**
```bash
# For Docker PostgreSQL
docker compose --profile tools up -d adminer
# Open http://localhost:8090
# Server: db
# Username: ec2lab
# Password: (from .env)
# Database: ec2lab

# For RDS (use SSH tunnel)
ssh -L 5433:your-rds-endpoint:5432 user@ec2-ip
# Then connect Adminer to localhost:5435 with RDS credentials
```

**Via PostgreSQL client on your machine:**
```bash
psql -h 127.0.0.1 -p 5433 -U ec2lab -d ec2lab
```

## Database Configuration

Environment variables in `.env`:

```bash
POSTGRES_DB=ec2lab           # Database name
POSTGRES_USER=ec2lab         # Database user
POSTGRES_PASSWORD=...        # Secure password (auto-generated)
```

## Data Persistence

Database data is stored in a Docker volume named `db-data`. This persists across container restarts and recreations.

To backup the database:
```bash
# For Docker PostgreSQL
docker compose exec db pg_dump -U ec2lab ec2lab > backup.sql

# For RDS (use psql with DATABASE_URL)
psql "$DATABASE_URL" > backup.sql
```

To restore from backup:
```bash
# For Docker PostgreSQL
docker compose exec -T db psql -U ec2lab ec2lab < backup.sql

# For RDS (use psql with DATABASE_URL)
psql "$DATABASE_URL" < backup.sql
```

## On EC2 Production

The same setup works on EC2. The deploy script (`scripts/deploy.sh`) will:

1. Pull the latest Docker images
2. Start the database and application (local PostgreSQL is the default)
3. Start the application
4. Wait for health checks
5. Rollback automatically if health checks fail

## Troubleshooting

### Database won't start
```bash
# Check logs
docker compose logs db

# Restart
docker compose restart db
```

### Connection refused
- Ensure the database container is running: `docker compose ps`
- Check the port mapping: `127.0.0.1:5435:5432`
- Verify credentials in `.env`

### Reset database (CAUTION: deletes all data)
```bash
docker compose down -v
docker compose up -d db
```

## Security Notes

1. **Never commit `.env`** - it contains passwords
2. **Use strong passwords** - the setup script generates them automatically
3. **Database is only accessible locally** - port 5433 is bound to 127.0.0.1
4. **On EC2**, access via SSH tunnel if needed:
   ```bash
   ssh -L 5433:127.0.0.1:5435 user@ec2-ip
   ```

## Alternative: AWS RDS PostgreSQL

For production or if you prefer a managed database service, you can use AWS RDS instead of Docker PostgreSQL.

**Benefits of RDS:**
- Automatic backups and point-in-time recovery
- Multi-AZ deployment for high availability
- Automatic storage scaling
- Managed maintenance and updates
- Enhanced monitoring with CloudWatch

**Setup:**
See [`11-rds-setup.md`](11-rds-setup.md) for complete RDS configuration guide.

**Quick switch to RDS:**
```bash
# 1. Configure RDS in Terraform (see docs/11-rds-setup.md)
# 2. Get connection string
cd terraform && terraform output rds_connection_string

# 3. Update .env
cd ..
# Set DATABASE_URL to the RDS connection string
# Set DATABASE_SSL=true

# 4. Start app without the local DB container
docker compose -f docker-compose.yml -f docker-compose.rds.yml up -d app
```

**Switch back to Docker PostgreSQL:**
```bash
# 1. Update .env to remove DATABASE_URL and set DATABASE_SSL=false
# 2. Start Docker PostgreSQL and app
docker compose up -d db app
```
