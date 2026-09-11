#!/usr/bin/env bash
# On EC2: bash scripts/deploy.sh IMAGE_TAG
# Stop on errors; the failing command prints its own error message.
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  echo 'Usage: bash scripts/deploy.sh IMAGE_TAG' >&2
  exit 1
fi

cd "$(dirname "$0")/.."
if [ ! -f helm/panel-ai/Chart.yaml ]; then
  echo 'Helm chart not found. Copy helm/ alongside scripts/.' >&2
  exit 1
fi
echo 'SUCCESS: Helm chart found.'

sudo k3s kubectl -n production get secret panel-ai-secrets >/dev/null
echo 'SUCCESS: Application Secret found.'

# Helm waits for healthy pods and attempts rollback if an upgrade fails.
echo "Deploying image tag $1..."
sudo env KUBECONFIG=/etc/rancher/k3s/k3s.yaml \
  helm upgrade --install panel-ai ./helm/panel-ai \
  --namespace production \
  --set-string image.tag="$1" \
  --atomic --timeout 5m
echo 'SUCCESS: Helm deployment completed.'

sudo k3s kubectl -n production get pods
echo 'SUCCESS: Pod status retrieved. Deployment complete.'
