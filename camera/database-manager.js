const Sequelize = require('sequelize');

const shortid = require('shortid');
const sequelize = new Sequelize('sqlite:snapshots.db')

class Counter extends Sequelize.Model {}
Counter.init({
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    value: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'counters',
    indexes: [
        {
            fields: ['name']
        }
    ]
});

class Snapshot extends Sequelize.Model {}
Snapshot.init({
    photo_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    order: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    modelName: 'snapshots',
    indexes: [
        {
            fields: ['photo_id']
        },
        {
            fields: ['order']
        },
        {
            fields: ['is_thumbnail_uploaded', 'is_notified']
        },
        {
            fields: ['is_raw_uploaded']
        }
    ]
});

class DatabaseManager {
    constructor() {
        // Uncomment below to recreate databases
        // sequelize.sync({force: true});
        
        sequelize.sync();
    }
    
    async recordSnapshot(snapshot) {
        let [counter, created] = await Counter.findOrCreate({
            where: {name: "snapshot"}, 
            defaults: {value: 0}
        });
        let snapshotDb = await Snapshot.create({
            photo_id: snapshot.photoId,
            rating: snapshot.rating,
            order: counter.value,
            is_notified: false,
            is_thumbnail_uploaded: false,
            is_raw_uploaded: false
        });
        
        console.log(' ---> Counter:', counter.value);
        counter.value += 1;
        counter.save();
        
        return snapshotDb;
    }
    
    async setSnapshotNotified(snapshot) {
        let snapshotDb = await Snapshot.findOne({
            where: {photo_id: snapshot.photoId}
        });

        snapshotDb.is_notified = true;
        snapshotDb.save();
        
        console.log(' ---> Set snapshot notified:', snapshot.photoId);
    }
    
    async setSnapshotThumbnailUploaded(snapshot) {
        let snapshotDb = await Snapshot.findOne({
            where: {photo_id: snapshot.photoId}
        });

        snapshotDb.is_thumbnail_uploaded = true;
        snapshotDb.save();
        
        console.log(' ---> Set snapshot thumbnail uploaded:', snapshot.photoId);
    }
    
    async deleteSnapshot(snapshot) {
        await Snapshot.destroy({
            where: {photo_id: snapshot.photoId}
        });
    }
    
    async nextSnapshotThumbnailToSend() {
        let snapshotDb = await Snapshot.findOne({
            where: {
                'is_thumbnail_uploaded': false,
                'is_notified': true
            },
            order: [['order', 'DESC']]
        });
        if (snapshotDb) {
            return {
                photoId: snapshotDb.photo_id,
                rating: snapshotDb.rating
            };
        }
    }
    
    generateId() {
        return shortid.generate();
    }
    
}

exports.DatabaseManager = DatabaseManager;
exports.Snapshot = Snapshot;