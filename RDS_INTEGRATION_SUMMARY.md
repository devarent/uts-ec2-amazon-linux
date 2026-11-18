# AWS RDS PostgreSQL Integration Summary

This document summarizes the AWS RDS PostgreSQL integration that has been added to your project.

## What Was Added

### 1. Terraform Infrastructure (`terraform/`)

**New file: `terraform/rds.tf`**
- RDS subnet group for private subnets
- RDS security group (only accessible from EC2)
- RDS PostgreSQL instance with:
  - Encryption at rest
  - Automated backups
  - Performance Insights
  - CloudWatch log exports
  - Parameter and option groups for performance tuning

**Updated files:**
- `terraform/variables.tf` - Added RDS configuration variables
- `terraform/outputs.tf` - Added RDS connection outputs
- `terraform/main.tf` - Added private subnets for RDS
- `terraform/terraform.tfvars.example` - Added RDS configuration examples

### 2. Docker Compose Updates (`docker-compose.yml`)

- Added `DATABASE_SSL` environment variable support
- Made `db` service optional with `local-db` profile
- Made `db` dependency optional for `app` service
- This allows seamless switching between Docker PostgreSQL and RDS

### 3. Scripts (`scripts/`)

**New scripts:**
- `scripts/manage-db.sh` - Database configuration manager
  - `status` - Show current database configuration
  - `backup` - Backup current database (Docker or RDS)
  - `rds` - Configure for AWS RDS
  - `docker` - Configure for Docker PostgreSQL
  - `test` - Test database connection

- `scripts/update-compose.sh` - Docker Compose configuration updater
  - `status` - Show current configuration
  - `rds` - Configure for AWS RDS (makes db service optional)
  - `docker` - Configure for Docker PostgreSQL (makes db service required)
  - `restore` - Restore from backup
  - `validate` - Validate docker-compose.yml

### 4. Documentation (`docs/`)

**New documentation:**
- `docs/11-rds-setup.md` - Complete RDS setup guide
- Updated `docs/DATABASE_SETUP.md` - Added RDS alternative section

**Updated documentation:**
- `README.md` - Added RDS option and comparison
- `.env.example` - Added RDS configuration examples

## How It Works

### Default Behavior (Docker PostgreSQL)

By default, the project uses Docker PostgreSQL:
- `db` service runs PostgreSQL 17 in a container
- Data persists in `db-data` volume
- No additional AWS costs
- Simple, self-contained setup

### RDS Mode (Managed PostgreSQL)

When RDS is configured:
1. Terraform creates RDS infrastructure in private subnets
2. RDS is only accessible from EC2 security group
3. App connects via `DATABASE_URL` environment variable
4. `DATABASE_SSL=true` enables SSL encryption
5. `db` service doesn't start (has `local-db` profile)
6. Automatic backups, Multi-AZ, and scaling available

## Quick Start Guide

### Option 1: Docker PostgreSQL (Default)

```bash
# Initialize with secure credentials
bash scripts/setup-db.sh

# Start database with local-db profile
docker compose --profile local-db up -d db

# Verify connection
bash scripts/check-db.sh

# Start full application
docker compose up -d
```

### Option 2: AWS RDS PostgreSQL

```bash
# 1. Configure Terraform with RDS variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars and add RDS configuration

# 2. Deploy infrastructure
terraform init
terraform plan
terraform apply

# 3. Get RDS connection string
terraform output rds_connection_string

# 4. Update .env with RDS connection
cd ..
# Update .env:
# DATABASE_URL=postgresql://user:pass@endpoint:5432/db
# DATABASE_SSL=true

# 5. Deploy application (db service won't start)
docker compose up -d app
```

## Switching Between Modes

### Switch to RDS

```bash
# 1. Configure RDS in Terraform and deploy
cd terraform && terraform apply

# 2. Get connection string
terraform output rds_connection_string

# 3. Update .env
cd ..
# Set DATABASE_URL and DATABASE_SSL=true in .env

# 4. Update docker-compose.yml (optional, already supports profiles)
bash scripts/update-compose.sh rds

# 5. Deploy
docker compose up -d app
```

### Switch to Docker PostgreSQL

```bash
# 1. Update .env to remove DATABASE_URL and set DATABASE_SSL=false

# 2. Update docker-compose.yml
bash scripts/update-compose.sh docker

# 3. Deploy with local db
docker compose --profile local-db up -d db app
```

## Cost Comparison

| Feature | Docker PostgreSQL | AWS RDS PostgreSQL |
|---------|------------------|-------------------|
| **Cost** | Free (uses EC2 resources) | ~$15-20/month minimum |
| **Setup** | Simple (docker compose) | Terraform configuration |
| **Backups** | Manual (scripts) | Automatic (configurable) |
| **High Availability** | Manual (single instance) | Multi-AZ option |
| **Monitoring** | Basic (Docker logs) | CloudWatch + Performance Insights |
| **Maintenance** | Manual (you manage) | Automatic (AWS manages) |

## Security Features

### Docker PostgreSQL
- Database only accessible via loopback (127.0.0.1:5433)
- Not exposed to internet
- Password in .env file (not committed)
- Docker network isolation

### AWS RDS
- Database in private subnets (no public access)
- Only accessible from EC2 security group
- Encryption at rest and in transit
- Automatic backups with encryption
- IAM-based access control
- CloudWatch monitoring and alerts

## Migration Guide

### From Docker to RDS

1. **Backup Docker database:**
   ```bash
   docker compose --profile local-db exec db pg_dump -U ec2lab ec2lab > backup.sql
   ```

2. **Restore to RDS:**
   ```bash
   psql "$DATABASE_URL" < backup.sql
   ```

3. **Update .env** with RDS connection string

4. **Deploy app** without local db service

### From RDS to Docker

1. **Backup RDS database:**
   ```bash
   psql "$DATABASE_URL" > backup.sql
   ```

2. **Restore to Docker:**
   ```bash
   docker compose --profile local-db exec -T db psql -U ec2lab ec2lab < backup.sql
   ```

3. **Update .env** to use local Docker PostgreSQL

4. **Deploy app** with local db service

## Troubleshooting

### RDS Connection Issues

```bash
# Test connection from EC2
docker compose exec app node -e "
const { Client } = require('pg');
const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  console.log('Connected successfully');
  client.end();
}).catch(err => console.error('Connection failed:', err));
"
```

### Database Won't Start

```bash
# Check logs
docker compose --profile local-db logs db

# Restart
docker compose --profile local-db restart db
```

### Switch Back to Docker

```bash
# Update .env to remove DATABASE_URL
# Run: bash scripts/update-compose.sh docker
# Deploy: docker compose --profile local-db up -d db app
```

## Next Steps

1. **Test RDS connection** from your application
2. **Set up monitoring** alerts for RDS metrics
3. **Configure backup schedule** for your needs
4. **Plan for scaling** as your application grows
5. **Consider read replicas** for high-traffic applications
6. **Explore Aurora** for enhanced PostgreSQL capabilities

## Support

- AWS RDS Documentation: https://docs.aws.amazon.com/rds/
- PostgreSQL on RDS: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/db_instance

## Files Modified/Created

### Created:
- `terraform/rds.tf`
- `scripts/manage-db.sh`
- `scripts/update-compose.sh`
- `docs/11-rds-setup.md`
- `RDS_INTEGRATION_SUMMARY.md` (this file)

### Modified:
- `terraform/variables.tf`
- `terraform/outputs.tf`
- `terraform/main.tf`
- `terraform/terraform.tfvars.example`
- `docker-compose.yml`
- `.env.example`
- `README.md`
- `docs/DATABASE_SETUP.md`
- `scripts/manage-db.sh`
- `scripts/update-compose.sh`
