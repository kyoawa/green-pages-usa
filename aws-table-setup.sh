#!/bin/bash

# Green Pages USA - DynamoDB Table Setup
# Run this script to create the required tables for cart system
# Prerequisites: AWS CLI configured with your credentials

set -e  # Exit on error

REGION="us-west-2"

echo "=================================================="
echo "Green Pages USA - DynamoDB Table Setup"
echo "=================================================="
echo ""
echo "This will create the following tables:"
echo "1. green-pages-carts"
echo "2. green-pages-reservations (NEW - replaces old one)"
echo "3. green-pages-orders (if doesn't exist)"
echo ""
echo "Region: $REGION"
echo ""

# Function to check if table exists
table_exists() {
    aws dynamodb describe-table --table-name "$1" --region "$REGION" &>/dev/null
}

# ================================================
# TABLE 1: green-pages-carts
# ================================================
echo "Creating green-pages-carts..."

if table_exists "green-pages-carts"; then
    echo "⚠️  Table 'green-pages-carts' already exists. Skipping..."
else
    aws dynamodb create-table \
        --table-name green-pages-carts \
        --attribute-definitions \
            AttributeName=userId,AttributeType=S \
        --key-schema \
            AttributeName=userId,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION"

    echo "✅ Created green-pages-carts"
fi

echo ""

# ================================================
# TABLE 2: green-pages-reservations
# ================================================
echo "Setting up green-pages-reservations..."

if table_exists "green-pages-reservations"; then
    echo "⚠️  Table 'green-pages-reservations' already exists."
    echo ""
    echo "IMPORTANT: The old table has partition key 'userId'"
    echo "           The new design needs partition key 'reservationId'"
    echo ""
    read -p "Do you want to DELETE and recreate this table? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        echo "Deleting old green-pages-reservations table..."
        aws dynamodb delete-table \
            --table-name green-pages-reservations \
            --region "$REGION"

        echo "Waiting for table to be deleted..."
        aws dynamodb wait table-not-exists \
            --table-name green-pages-reservations \
            --region "$REGION"

        echo "✅ Old table deleted"

        # Create new table
        echo "Creating new green-pages-reservations table..."
        aws dynamodb create-table \
            --table-name green-pages-reservations \
            --attribute-definitions \
                AttributeName=reservationId,AttributeType=S \
                AttributeName=itemId,AttributeType=S \
                AttributeName=expiresAt,AttributeType=N \
            --key-schema \
                AttributeName=reservationId,KeyType=HASH \
            --global-secondary-indexes \
                "[
                    {
                        \"IndexName\": \"itemId-expiresAt-index\",
                        \"KeySchema\": [
                            {\"AttributeName\":\"itemId\",\"KeyType\":\"HASH\"},
                            {\"AttributeName\":\"expiresAt\",\"KeyType\":\"RANGE\"}
                        ],
                        \"Projection\": {\"ProjectionType\":\"ALL\"},
                        \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                    }
                ]" \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION"

        echo "Waiting for table to be created..."
        aws dynamodb wait table-exists \
            --table-name green-pages-reservations \
            --region "$REGION"

        # Enable TTL
        echo "Enabling TTL on expiresAt field..."
        aws dynamodb update-time-to-live \
            --table-name green-pages-reservations \
            --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
            --region "$REGION"

        echo "✅ Created new green-pages-reservations with TTL"
    else
        echo "⚠️  Skipping green-pages-reservations recreation"
        echo "   WARNING: Cart system may not work correctly with old schema!"
    fi
else
    # Create new table
    echo "Creating green-pages-reservations table..."
    aws dynamodb create-table \
        --table-name green-pages-reservations \
        --attribute-definitions \
            AttributeName=reservationId,AttributeType=S \
            AttributeName=itemId,AttributeType=S \
            AttributeName=expiresAt,AttributeType=N \
        --key-schema \
            AttributeName=reservationId,KeyType=HASH \
        --global-secondary-indexes \
            "[
                {
                    \"IndexName\": \"itemId-expiresAt-index\",
                    \"KeySchema\": [
                        {\"AttributeName\":\"itemId\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"expiresAt\",\"KeyType\":\"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                }
            ]" \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION"

    echo "Waiting for table to be created..."
    aws dynamodb wait table-exists \
        --table-name green-pages-reservations \
        --region "$REGION"

    # Enable TTL
    echo "Enabling TTL on expiresAt field..."
    aws dynamodb update-time-to-live \
        --table-name green-pages-reservations \
        --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
        --region "$REGION"

    echo "✅ Created green-pages-reservations with TTL"
fi

echo ""

# ================================================
# TABLE 3: green-pages-orders
# ================================================
echo "Setting up green-pages-orders..."

if table_exists "green-pages-orders"; then
    echo "✅ Table 'green-pages-orders' already exists"

    # Check if it has the userId GSI
    echo "Checking for userId-createdAt-index..."
    if aws dynamodb describe-table \
        --table-name green-pages-orders \
        --region "$REGION" \
        --query "Table.GlobalSecondaryIndexes[?IndexName=='userId-createdAt-index']" \
        --output text | grep -q "userId-createdAt-index"; then
        echo "✅ GSI userId-createdAt-index already exists"
    else
        echo "Adding userId-createdAt-index GSI..."
        aws dynamodb update-table \
            --table-name green-pages-orders \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
                AttributeName=createdAt,AttributeType=S \
            --global-secondary-index-updates \
                "[
                    {
                        \"Create\": {
                            \"IndexName\": \"userId-createdAt-index\",
                            \"KeySchema\": [
                                {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                                {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
                            ],
                            \"Projection\": {\"ProjectionType\":\"ALL\"},
                            \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                        }
                    }
                ]" \
            --region "$REGION"

        echo "✅ Added GSI userId-createdAt-index"
    fi
else
    echo "Creating green-pages-orders table..."
    aws dynamodb create-table \
        --table-name green-pages-orders \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=userId,AttributeType=S \
            AttributeName=createdAt,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --global-secondary-indexes \
            "[
                {
                    \"IndexName\": \"userId-createdAt-index\",
                    \"KeySchema\": [
                        {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
                    ],
                    \"Projection\": {\"ProjectionType\":\"ALL\"},
                    \"ProvisionedThroughput\": {\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
                }
            ]" \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION"

    echo "✅ Created green-pages-orders with GSI"
fi

echo ""

# ================================================
# TABLE 4: green-pages-saved-progress (OPTIONAL)
# ================================================
echo "Setting up green-pages-saved-progress (optional autosave feature)..."

if table_exists "green-pages-saved-progress"; then
    echo "✅ Table 'green-pages-saved-progress' already exists"

    # Enable TTL if not already enabled
    echo "Ensuring TTL is enabled on expiresAt field..."
    aws dynamodb update-time-to-live \
        --table-name green-pages-saved-progress \
        --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
        --region "$REGION" 2>/dev/null || echo "TTL already enabled"
else
    read -p "Do you want to create green-pages-saved-progress? (for autosave feature) (yes/no): " create_progress

    if [ "$create_progress" = "yes" ]; then
        echo "Creating green-pages-saved-progress table..."
        aws dynamodb create-table \
            --table-name green-pages-saved-progress \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
            --key-schema \
                AttributeName=userId,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION"

        echo "Waiting for table to be created..."
        aws dynamodb wait table-exists \
            --table-name green-pages-saved-progress \
            --region "$REGION"

        # Enable TTL
        echo "Enabling TTL on expiresAt field..."
        aws dynamodb update-time-to-live \
            --table-name green-pages-saved-progress \
            --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
            --region "$REGION"

        echo "✅ Created green-pages-saved-progress with TTL"
    else
        echo "⚠️  Skipping green-pages-saved-progress (autosave disabled)"
    fi
fi

echo ""
echo "=================================================="
echo "✅ DynamoDB Table Setup Complete!"
echo "=================================================="
echo ""
echo "Tables created/updated:"
echo "  ✅ green-pages-carts"
echo "  ✅ green-pages-reservations (with TTL)"
echo "  ✅ green-pages-orders (with userId GSI)"
if [ "$create_progress" = "yes" ]; then
    echo "  ✅ green-pages-saved-progress (with TTL)"
fi
echo ""
echo "Next steps:"
echo "1. Verify tables in AWS Console"
echo "2. Add these to your .env.local:"
echo "   CART_TABLE_NAME=green-pages-carts"
echo "   RESERVATIONS_TABLE_NAME=green-pages-reservations"
echo "   ORDERS_TABLE_NAME=green-pages-orders"
echo "   SAVED_PROGRESS_TABLE_NAME=green-pages-saved-progress"
echo ""
echo "3. Run: npm run dev"
echo "4. Cart APIs will be available at /api/cart/*"
echo ""
