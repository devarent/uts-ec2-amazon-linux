# AWS RDS PostgreSQL Setup Guide

This guide explains how to use AWS RDS (Relational Database Service) instead of running PostgreSQL inside Docker on your EC2 instance.

## Overview

Your project supports two database options:

1. **Docker PostgreSQL** (default) - PostgreSQL runs inside Docker on EC2
2. **AWS RDS PostgreSQL** - Managed database service with automatic backups, scaling, and high availability

## When to Use RDS

✅ **Use RDS when:**
- You need automatic backups and point-in-time recovery
- You want Multi-AZ deployment for high availability
- You need to scale storage/compute independently
- You want to reduce operational overhead
- You're building a production application
- You need compliance with data residency requirements

❌ **Use Docker PostgreSQL when:**
- This is a lab/learning project
- You want a simple, self-contained setup
- Cost is a primary concern (RDS has ongoing costs)
- You need full control over the database configuration

## Cost Considerations

**Docker PostgreSQL (Free):**
- Runs on your existing EC2 instance
- No additional AWS charges
- You manage backups and maintenance

**AWS RDS PostgreSQL (Paid):**
- db.t3.micro: ~$0.018/hour (~$13/month)
- 20 GB storage: ~$0.115/GB/month (~$2.30/month)
- Backup storage: Free up to database size
- **Total: ~$15-20/month minimum**

## Setup Instructions

### Step 1: Configure Terraform Variables

Copy `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars` and
uncomment the RDS settings you need. Do not save the password in the tfvars file:

```hcl
# RDS Configuration
rds_postgres_version      = "15.4"
rds_instance_class        = "db.t3.micro"  # Free tier eligible
rds_allocated_storage     = 20
rds_max_allocated_storage = 100
rds_database_name         = "ec2lab"
rds_master_username       = "ec2lab_admin"
rds_multi_az              = false  # Set to true for production
rds_backup_retention_period = 7
rds_performance_insights  = true
rds_deletion_protection   = true
rds_skip_final_snapshot   = false
```

Pass a strong URL-safe password through `TF_VAR_rds_master_password`. Terraform
state still stores it, so protect the state file and use an encrypted remote
backend for long-lived deployments.
In PowerShell, set it with
`$env:TF_VAR_rds_master_password = 'strong-url-safe-password'`.

### Step 2: Deploy RDS with Terraform

```bash
cd terraform
export TF_VAR_rds_master_password='strong-url-safe-password'
terraform init
terraform plan
terraform apply
```

Terraform will create:
- RDS subnet group
- RDS security group (only accessible from EC2)
- RDS PostgreSQL instance
- Parameter and option groups
- CloudWatch log exports

### Step 3: Get RDS Connection Details

After deployment, get the RDS host and port:

```bash
terraform output -raw rds_address
terraform output -raw rds_port
```

Use the database name and username configured in `terraform.tfvars`, plus the
password supplied through `TF_VAR_rds_master_password`. Avoid printing or
copying the sensitive `rds_connection_string` output.

### Step 4: Update Application Configuration

Update the root `.env` file on EC2 and protect it with `chmod 600`:

```dotenv
# Use RDS instead of Docker PostgreSQL
DATABASE_URL=postgresql://ec2lab_admin:YourStrongPassword123!@your-rds-endpoint:5432/ec2lab
DATABASE_SSL=true  # Required for RDS

# Keep Docker PostgreSQL for local development
# POSTGRES_DB=ec2lab
# POSTGRES_USER=ec2lab
# POSTGRES_PASSWORD=local_password
```

Use a URL-safe password or percent-encode reserved characters in the connection
URL. Start the app without the local DB container using the RDS override:

```bash
docker compose -f docker-compose.yml -f docker-compose.rds.yml up -d app
```

### Step 5: Deploy Application

```bash
cd /opt/app
docker compose -f docker-compose.yml -f docker-compose.rds.yml up -d app
curl -fsS http://127.0.0.1:3000/api/health
```

## RDS Configuration Details

### Instance Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `rds_instance_class` | `db.t3.micro` | Free tier eligible, 1 vCPU, 1 GB RAM |
| `rds_allocated_storage` | `20 GB` | Initial storage allocation |
| `rds_max_allocated_storage` | `100 GB` | Maximum storage for autoscaling |
| `rds_postgres_version` | `15.4` | PostgreSQL version |
| `rds_multi_az` | `false` | Enable for high availability |

### Security Configuration

- **Encryption at rest**: Enabled by default
- **Network isolation**: RDS only accessible from EC2 security group
- **Public access**: Disabled (`publicly_accessible = false`)
- **Backup encryption**: Enabled
- **Performance Insights**: Enabled for monitoring

### Backup Configuration

- **Backup retention**: 7 days (configurable 0-35 days)
- **Backup window**: 03:00-04:00 UTC
- **Maintenance window**: Sunday 04:00-05:00 UTC
- **Point-in-time recovery**: Enabled
- **Automated backups**: Enabled
- `scripts/backup-db.sh` and `scripts/restore-db.sh` operate on the local Docker
  database only. Use RDS automated backups, point-in-time recovery, or snapshots
  when the application is configured for RDS.

### Monitoring

- **CloudWatch logs**: PostgreSQL logs exported
- **Performance Insights**: Enabled (7-day retention)
- **Enhanced monitoring**: Available (additional cost)

## Connecting to RDS

### From EC2 (Application)

Your Next.js app connects via `DATABASE_URL`:

```bash
# Test connection from EC2
docker compose exec app node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => client.query('SELECT version()')).then(r => {
  console.log(r.rows[0].version);
  client.end();
});
"
```

### From Your Local Machine (psql)

For security, RDS is not publicly accessible. Use SSH tunnel:

```bash
# Create SSH tunnel
ssh -L 5433:your-rds-endpoint.rds.amazonaws.com:5432 admin@your-ec2-ip

# Connect with psql (in another terminal)
psql -h localhost -p 5433 -U ec2lab_admin -d ec2lab
```

### Using Adminer

Adminer can connect to RDS through the SSH tunnel:

1. Create SSH tunnel as above
2. Open Adminer: `docker compose --profile tools up -d adminer`
3. Connect to `localhost:5433` with RDS credentials

## Migration from Docker to RDS

If you have existing data in Docker PostgreSQL:

### Step 1: Backup Docker Database

```bash
cd /opt/app
docker compose exec db pg_dump -U ec2lab ec2lab > backup.sql
```

### Step 2: Restore to RDS

```bash
# Copy backup to EC2
scp backup.sql admin@your-ec2-ip:/tmp/

# Restore to RDS
psql "postgresql://ec2lab_admin:password@rds-endpoint:5432/ec2lab" < /tmp/backup.sql
```

### Step 3: Update Configuration

Update `.env` to use RDS connection string and redeploy.

## RDS Management

### View RDS Status

```bash
aws rds describe-db-instances --db-instance-identifier your-rds-id
```

### View RDS Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=your-rds-id \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Modify RDS Instance

```bash
aws rds modify-db-instance \
  --db-instance-identifier your-rds-id \
  --allocated-storage 50 \
  --apply-immediately
```

### Create Manual Snapshot

```bash
aws rds create-db-snapshot \
  --db-instance-identifier your-rds-id \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

### Restore from Snapshot

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier restored-instance \
  --db-snapshot-identifier manual-snapshot-20240101
```

## Troubleshooting

### Connection Issues

**Problem**: Application can't connect to RDS

**Solutions**:
1. Check security group allows traffic from EC2
2. Verify RDS endpoint is correct
3. Ensure `DATABASE_SSL=true` is set
4. Check RDS instance status is "available"
5. Verify credentials are correct

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

### SSL Certificate Issues

**Problem**: SSL certificate verification fails

**Solution**: For RDS, you may need to disable SSL verification in development:

```typescript
// app/lib/db.ts
ssl: process.env.DATABASE_SSL === "true" 
  ? { rejectUnauthorized: false } // For development
  : undefined
```

### Performance Issues

**Problem**: Slow database queries

**Solutions**:
1. Enable Performance Insights (already enabled by default)
2. Check parameter group settings
3. Consider upgrading instance class
4. Review slow query logs in CloudWatch

### Backup Issues

**Problem**: Backups not working

**Solutions**:
1. Check backup retention period is > 0
2. Verify backup window doesn't conflict with maintenance
3. Check RDS instance status
4. Review CloudWatch logs for errors

## Cost Optimization

### Free Tier

- db.t3.micro is free tier eligible for 12 months
- 20 GB storage included
- Monitor usage to avoid charges

### Cost Reduction Tips

1. **Use db.t3.micro** for development
2. **Enable storage autoscaling** to avoid over-provisioning
3. **Set appropriate backup retention** (7 days is usually sufficient)
4. **Disable Performance Insights** if not needed (saves ~$1/month)
5. **Use Multi-AZ only in production** (doubles cost)
6. **Monitor CloudWatch costs** for log retention

## Security Best Practices

1. **Never expose RDS publicly** - keep `publicly_accessible = false`
2. **Use strong passwords** - at least 16 characters with mixed case, numbers, symbols
3. **Enable encryption** - both at rest and in transit
4. **Regular backups** - enable automated backups with appropriate retention
5. **Monitor access** - use CloudWatch and Performance Insights
6. **Rotate credentials** - change passwords regularly
7. **Use IAM authentication** - for additional security (advanced)

## Cleanup

To destroy RDS instance:

```bash
cd terraform
terraform destroy
```

⚠️ **Warning**: This will delete the RDS instance and all data. Make sure you have backups if needed.

To destroy only RDS (keep EC2):

```bash
# Remove RDS password from terraform.tfvars
# Then run terraform apply
terraform apply
```

## Comparison: Docker vs RDS

| Feature | Docker PostgreSQL | AWS RDS PostgreSQL |
|---------|------------------|-------------------|
| **Cost** | Free (uses EC2 resources) | ~$15-20/month minimum |
| **Setup** | Simple (docker compose) | Terraform configuration |
| **Backups** | Manual (scripts) | Automatic (configurable) |
| **High Availability** | Manual (single instance) | Multi-AZ option |
| **Scaling** | Manual (EC2 limits) | Automatic storage scaling |
| **Monitoring** | Basic (Docker logs) | CloudWatch + Performance Insights |
| **Maintenance** | Manual (you manage) | Automatic (AWS manages) |
| **Security** | Docker network isolation | VPC + security groups |
| **Performance** | Depends on EC2 instance | Dedicated database resources |
| **Compliance** | Your responsibility | AWS compliance certifications |

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
