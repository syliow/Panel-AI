# Terraform: EC2 and CloudWatch

- `main.tf` imports the existing Panel AI EC2 instance in `ap-southeast-1`.
- `cloudwatch.tf` adds alarms, email notifications, and metric publishing permissions for the EC2 role.

All alarms evaluate **three consecutive 5-minute periods (15 minutes)**:

| Alarm | Condition per period |
| --- | --- |
| CPU | Average usage >80% |
| RAM | Average usage >85% |
| Root disk `/` | Minimum usage >85% |
| EC2 health | Any instance or system status check failure |

Alerts and recovery notifications go to **liowshanyi@gmail.com**.

## Deploy

Use Terraform 1.6+ and working local AWS credentials. Check that the instance settings and instance profile name in `main.tf` match AWS.

From the project root:

```bash
cd terraform
aws sts get-caller-identity
terraform init
terraform validate
terraform plan 
```

On first setup, expect **7 new monitoring resources**, plus the EC2 import if needed. Resolve unexpected EC2 changes before applying the reviewed plan:

```bash
terraform apply monitoring.tfplan
```

Confirm the **SNS subscription email** to enable notifications. Applying a saved plan executes immediately.

## RAM and disk metrics

Install and configure the [CloudWatch Agent on EC2](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html); Terraform does not install it.

The alarms expect `CWAgent` metrics `mem_used_percent` and `disk_used_percent` with **only `InstanceId` as the dimension**. Collect disk usage for `/` only and configure `aggregation_dimensions` as `[["InstanceId"]]`. See the [agent configuration reference](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-Configuration-File-Details.html).

## Verify

- In CloudWatch, confirm all four alarms receive data after the evaluation window. For `INSUFFICIENT_DATA`, check the agent, metric dimensions, and IAM permissions.
- Publish a test message to the `panelai-ec2-alerts` SNS topic to check email delivery.
- Run `terraform plan` again; expect **no changes**.

Keep state files private and backed up; commit `.terraform.lock.hcl`. CloudWatch and SNS usage may incur charges. Do not use `terraform destroy` for cleanup—it manages your existing server.
