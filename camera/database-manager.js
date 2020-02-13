const Sequelize = require('sequelize');

const shortid = require('shortid');
const sequelize = new Sequelize('sqlite:snapshots.db')

class Snapshot extends Sequelize.Model {}
Snapshot.init({
    photoId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    rating: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    is_notified: {
        type: Sequelize.BOOLEAN,
        default: false
    },
    is_thumbnail_uploaded: {
        type: Sequelize.BOOLEAN,
        default: false
    },
    is_raw_uploaded: {
        type: Sequelize.BOOLEAN,
        default: false
    }
}, {
    sequelize,
    modelName: 'snapshot',
    indexes: [
        {
            fields: ['photoId']
        },
        {
            fields: ['is_thumbnail_uploaded']
        },
        {
            fields: ['is_raw_uploaded']
        }
    ]
});

class DatabaseManager {
    constructor() {
        sequelize.sync();
    }
    
    recordSnapshot(snapshot) {
        Snapshot.create({
            photoId: snapshot.photoId,
            rating: snapshot.rating
        })
    }
    
    generateId() {
        return shortid.generate();
    }
    
}

exports.DatabaseManager = DatabaseManager;
exports.Snapshot = Snapshot;