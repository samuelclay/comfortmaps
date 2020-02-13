const Sequelize = require('sequelize');

const sequelize = new Sequelize('sqlite:snapshots.db')

class Snapshot extends Sequelize.Model {}
Snapshot.init({
    uuid: {
        type: Sequelize.UUID,
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
}

exports.DatabaseManager = DatabaseManager;
exports.Snapshot = Snapshot;