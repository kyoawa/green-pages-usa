#!/bin/bash

# Create DynamoDB tables for discount system
# Usage: ./scripts/create-tables.sh
# Make sure AWS CLI is configured with your credentials

REGION="${AWS_REGION:-us-east-1}"

echo "Creating green-pages-bundle-deals table..."
aws dynamodb create-table \
  --table-name green-pages-bundle-deals \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "Creating green-pages-discount-codes table..."
aws dynamodb create-table \
  --table-name green-pages-discount-codes \
  --attribute-definitions AttributeName=code,AttributeType=S \
  --key-schema AttributeName=code,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION

echo "Done! Tables created."
