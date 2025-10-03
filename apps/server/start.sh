#!/bin/bash

echo "🚀 Starting ShPoint Server..."

# Function to run migrations with retry
run_migrations() {
    echo "📊 Running database migrations..."
    
    for i in {1..3}; do
        echo "🔄 Migration attempt $i/3..."
        
        if timeout 30 npx prisma migrate deploy --skip-seed; then
            echo "✅ Migrations completed successfully!"
            return 0
        else
            echo "❌ Migration attempt $i failed"
            if [ $i -lt 3 ]; then
                echo "⏳ Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
    done
    
    echo "⚠️ All migration attempts failed, trying db push as fallback..."
    if timeout 30 npx prisma db push --accept-data-loss; then
        echo "✅ Database schema synced with db push!"
        return 0
    else
        echo "❌ Database sync failed completely!"
        return 1
    fi
}

# Run migrations with retry
if run_migrations; then
    echo "🎉 Database ready, starting server..."
    node dist/index.js
else
    echo "💥 Failed to setup database, exiting..."
    exit 1
fi
