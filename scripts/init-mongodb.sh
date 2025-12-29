#!/bin/bash

# Simple MongoDB Initialization Script
# Initializes MongoDB with users and sample tennis player data

set -e

# Configuration with defaults
DB_NAME="${MONGO_INITDB_DATABASE:-latelier_dev}"
ROOT_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
ROOT_PASS="${MONGO_INITDB_ROOT_PASSWORD:-dev_password}"
APP_USER="${MONGO_APP_USERNAME:-app_user}"
APP_PASS="${MONGO_APP_PASSWORD:-dev_password}"

echo "Starting MongoDB initialization..."

# Wait for MongoDB to be ready
until mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    echo "Waiting for MongoDB..."
    sleep 2
done

echo "MongoDB is ready"

# Check if database already exists
DB_EXISTS=$(mongosh --quiet --eval "
    const dbs = db.adminCommand('listDatabases').databases;
    const exists = dbs.some(db => db.name === '$DB_NAME');
    print(exists);
" 2>/dev/null || echo "false")

if [ "$DB_EXISTS" = "true" ]; then
    echo "Database '$DB_NAME' already exists, skipping initialization"
    exit 0
fi

echo "Initializing database: $DB_NAME"

# Create root user
mongosh --quiet --eval "
    try {
        db.getSiblingDB('admin').createUser({
            user: '$ROOT_USER',
            pwd: '$ROOT_PASS',
            roles: ['root']
        });
        print('Root user created');
    } catch (e) {
        if (!e.message.includes('already exists')) {
            throw e;
        }
        print('Root user already exists');
    }
"

# Create application database and user
mongosh --quiet --eval "
    db = db.getSiblingDB('$DB_NAME');
    
    db.createUser({
        user: '$APP_USER',
        pwd: '$APP_PASS',
        roles: [{
            role: 'readWrite',
            db: '$DB_NAME'
        }]
    });
    
    print('Application user created: $APP_USER');
"

# Insert sample tennis players data
mongosh --quiet "$DB_NAME" --eval "
    const playersData = [
        {
            id: 17,
            firstname: 'Rafael',
            lastname: 'Nadal',
            shortname: 'R.NAD',
            sex: 'M',
            country: {
                picture: 'https://tenisu.latelier.co/resources/Espagne.png',
                code: 'ESP'
            },
            picture: 'https://tenisu.latelier.co/resources/Nadal.png',
            data: {
                rank: 1,
                points: 1982,
                weight: 85000,
                height: 185,
                age: 33,
                last: [1, 0, 0, 0, 1]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 52,
            firstname: 'Novak',
            lastname: 'Djokovic',
            shortname: 'N.DJO',
            sex: 'M',
            country: {
                picture: 'https://tenisu.latelier.co/resources/Serbie.png',
                code: 'SRB'
            },
            picture: 'https://tenisu.latelier.co/resources/Djokovic.png',
            data: {
                rank: 2,
                points: 2542,
                weight: 80000,
                height: 188,
                age: 31,
                last: [1, 1, 1, 1, 1]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 102,
            firstname: 'Serena',
            lastname: 'Williams',
            shortname: 'S.WIL',
            sex: 'F',
            country: {
                picture: 'https://tenisu.latelier.co/resources/USA.png',
                code: 'USA'
            },
            picture: 'https://tenisu.latelier.co/resources/Serena.png',
            data: {
                rank: 10,
                points: 3521,
                weight: 72000,
                height: 175,
                age: 37,
                last: [0, 1, 1, 1, 0]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 65,
            firstname: 'Stan',
            lastname: 'Wawrinka',
            shortname: 'S.WAW',
            sex: 'M',
            country: {
                picture: 'https://tenisu.latelier.co/resources/Suisse.png',
                code: 'SUI'
            },
            picture: 'https://tenisu.latelier.co/resources/Wawrinka.png',
            data: {
                rank: 21,
                points: 1784,
                weight: 81000,
                height: 183,
                age: 33,
                last: [1, 1, 1, 0, 1]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 95,
            firstname: 'Venus',
            lastname: 'Williams',
            shortname: 'V.WIL',
            sex: 'F',
            country: {
                picture: 'https://tenisu.latelier.co/resources/USA.png',
                code: 'USA'
            },
            picture: 'https://tenisu.latelier.co/resources/Venus.webp',
            data: {
                rank: 52,
                points: 1105,
                weight: 74000,
                height: 185,
                age: 38,
                last: [0, 1, 0, 0, 1]
            },
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    // Insert the players
    const result = db.players.insertMany(playersData);
    print('Inserted ' + result.insertedIds.length + ' tennis players');
    
    // Create indexes
    db.players.createIndex({ id: 1 }, { unique: true });
    db.players.createIndex({ 'data.rank': 1 });
    db.players.createIndex({ sex: 1 });
    db.players.createIndex({ 'country.code': 1 });
    db.players.createIndex({ firstname: 1, lastname: 1 });
    db.players.createIndex({ shortname: 1 }, { unique: true });
    
    print('Created performance indexes');
"

echo "Database initialization completed successfully!"
echo "- Database: $DB_NAME"
echo "- Users: $ROOT_USER (admin), $APP_USER (app)"
echo "- Players: 5 tennis players inserted"
echo "- Indexes: 6 performance indexes created"