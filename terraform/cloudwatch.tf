# All periods must breach the threshold. Missing metrics remain INSUFFICIENT_DATA.
resource "aws_sns_topic" "alerts" {
  name = "panelai-ec2-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "liowshanyi@gmail.com"
}

data "aws_iam_instance_profile" "app" {
  name = aws_instance.app.iam_instance_profile
}

resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name = "panelai-cloudwatch-metrics"
  role = data.aws_iam_instance_profile.app.role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "cloudwatch:PutMetricData"
      Resource = "*"
      Condition = {
        StringEquals = { "cloudwatch:namespace" = "CWAgent" }
      }
    }]
  })
}

resource "aws_cloudwatch_metric_alarm" "cpu" {
  alarm_name          = "panelai-ec2-cpu-high"
  alarm_description   = "Average CPU above 80% for 15 minutes."
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 80
  period              = 300
  evaluation_periods  = 3
  statistic           = "Average"
  dimensions          = { InstanceId = aws_instance.app.id }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "memory" {
  alarm_name          = "panelai-ec2-memory-high"
  alarm_description   = "Average RAM usage above 85% for 15 minutes."
  namespace           = "CWAgent"
  metric_name         = "mem_used_percent"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 85
  period              = 300
  evaluation_periods  = 3
  statistic           = "Average"
  dimensions          = { InstanceId = aws_instance.app.id }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "disk" {
  alarm_name          = "panelai-ec2-root-disk-high"
  alarm_description   = "Minimum root disk usage above 85% for 15 minutes."
  namespace           = "CWAgent"
  metric_name         = "disk_used_percent"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 85
  period              = 300
  evaluation_periods  = 3
  statistic           = "Minimum"
  dimensions          = { InstanceId = aws_instance.app.id }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "status" {
  alarm_name          = "panelai-ec2-status-check-failed"
  alarm_description   = "EC2 instance or system status check failed in three consecutive 5-minute periods."
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  period              = 300
  evaluation_periods  = 3
  statistic           = "Maximum"
  dimensions          = { InstanceId = aws_instance.app.id }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
