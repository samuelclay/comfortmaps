var bleno = require('bleno');
var util = require('util');
const fs = require('fs');
const sharp = require('sharp');

var serviceUuids = ["ec20"]

class BluetoothManager {    
    constructor(camera) {
        this.camera = camera;
        this.snapshotCharacteristic = new SnapshotCharacteristic();
        this.photoDataCharacteristic = new PhotoDataCharacteristic();
        this.snapshotCharacteristic.camera = this.camera;
        this.photoDataCharacteristic.camera = this.camera;
        
        bleno.on('stateChange', (state) => {
            
            if (state == "poweredOn") {
                bleno.startAdvertising("Comfort Maps Camera", serviceUuids)
            } else {
                console.log(" ---> Bluetooth:", state);
                bleno.stopAdvertising();
            }
        });
        
        bleno.on('advertisingStart', (error) => {
            console.log(" ---> Bluetooth advertising start:", (error ? 'error ' + error : 'success'));
            
            if (!error) {
                bleno.setServices([
                    new bleno.PrimaryService({
                        uuid: 'ec20',
                        characteristics: [
                            this.snapshotCharacteristic,
                            this.photoDataCharacteristic
                        ]
                    })
                ]);
            }
        });
    }
    
    async sendPhoto(snapshot) {
        this.snapshotCharacteristic.beginSnapshotTransfer(snapshot);
        this.photoDataCharacteristic.beginPhotoDataTransfer(snapshot);
    }

}

class SnapshotCharacteristic {
    constructor() {
        SnapshotCharacteristic.super_.call(this, {
            uuid: 'ec2d',
            properties: ['read', 'write', 'notify'],
            value: null
        });
        
        this._value = new Buffer(0);
        this._updateValueCallback = null;
    }
    
    beginSnapshotTransfer(snapshot) {
        this.snapshot = snapshot;
        this.bytesRead = 0;
        this.chunkSize = 20;
        this.dataString = Buffer.from(JSON.stringify({
            id: snapshot.photoId,
            rating: snapshot.rating,
            acceleration: {
                x: 2,
                y: 3,
                z: 4
            }
        }, 'utf8'));
        this.dataSize = this.dataString.length;
        
        if (this._updateValueCallback) {
            const message = "S:" + snapshot.rating + ":" + this.dataSize + ":" + snapshot.photoId;
            this._value = Buffer.from(message, 'utf8');

            console.log(' ---> Notifying for snapshot transfer: ', message);
            this._updateValueCallback(this._value);
        }
    }
    
    async onReadRequest(offset, callback) {
        this._value = this.dataString.slice(this.bytesRead, this.bytesRead + this.chunkSize);
        this.bytesRead += this.chunkSize;

        // console.log(' ---> Snapshot reading:', this._value);
        callback(this.RESULT_SUCCESS, this._value);
        
        if (this.bytesRead >= this.dataSize && this.snapshot) {
            if (this._updateValueCallback) {
                this._value = Buffer.from("", 'utf8');
                console.log(' ---> Done uploading snapshot');
                this._updateValueCallback(this._value);
                await this.camera.databaseManager.setSnapshotNotified(this.snapshot);
                this.snapshot = null;
            }
            
        }
    }
    
    onWriteRequest(data, offset, withoutResponse, callback) {
        this._value = data;

        console.log(' ---> Snapshot write: ' + this._value.toString('hex'));

        if (this._updateValueCallback) {
            console.log(' ---> Snapshot write notifying');

            this._updateValueCallback(this._value);
        }

        callback(this.RESULT_SUCCESS);
    }
    
    onSubscribe(maxValueSize, updateValueCallback) {
        console.log(' ---> Snapshot subscribe: Hello', maxValueSize);

        this._updateValueCallback = updateValueCallback;
        this.snapshot = null;
    }
    
    onUnsubscribe() {
        console.log(' ---> Snapshot unsubscribe: Good-bye', this._updateValueCallback);

        this._updateValueCallback = null;
        this.snapshot = null;
    }
}

class PhotoDataCharacteristic {
    constructor() {
        PhotoDataCharacteristic.super_.call(this, {
            uuid: 'ec2e',
            properties: ['read', 'write', 'notify'],
            value: null
        });
        
        this._value = new Buffer(0);
        this._updateValueCallback = null;
    }
    
    async beginPhotoDataTransfer(snapshot) {
        if (this.snapshot && this.snapshot.photoId != snapshot.photoId) {
            // Wait in line
            return;
        }
        
        let photoRaw = await util.promisify(fs.readFile)("photos/"+snapshot.photoId+".jpg");
        let photoThumb;
        try {
            photoThumb = await sharp(photoRaw).resize(488).toBuffer();
        } catch (e) {
            console.log(" ---> Error in photo:", snapshot.photoId, e);
            this.camera.databaseManager.deleteSnapshot(snapshot);
            this.snapshot = null;
            this.sendNextPhoto();
            return;
        }
        
        console.log(' ---> Uploading photo thumb: ', photoRaw.length, " -> ", photoThumb.length);
        
        this.photo = photoThumb;
        this.snapshot = snapshot;
        this.bytesRead = 0;
        this.chunkSize = 20;
        this.photoSize = this.photo.length;
        
        if (this._updateValueCallback) {
            const message = "B:" + snapshot.rating + ":" + this.photoSize + ":" + snapshot.photoId;
            this._value = Buffer.from(message, 'utf8');

            console.log(' ---> Notifying for photo transfer: ', message);
            this._updateValueCallback(this._value);
        }
    }
    
    async onReadRequest(offset, callback) {
        // console.log(' ---> Reading', this.bytesRead, this.photoSize, this._value.toString('hex'));
        this._value = this.photo.slice(this.bytesRead, this.bytesRead + this.chunkSize);
        this.bytesRead += this.chunkSize;

        callback(this.RESULT_SUCCESS, this._value);

        if (this.bytesRead >= this.photoSize && this.snapshot) {
            if (this._updateValueCallback) {
                this._value = Buffer.from("", 'utf8');

                console.log(' ---> Done uploading photo: ', this.snapshot.photoId);
                this._updateValueCallback(this._value);
                await this.camera.databaseManager.setSnapshotThumbnailUploaded(this.snapshot);
            }
            this.snapshot = null;
            this.sendNextPhoto();
        }
    }
    
    async sendNextPhoto() {
        let snapshot = await this.camera.databaseManager.nextSnapshotThumbnailToSend();
        if (snapshot) {
            console.log(" ---> Sending next unsent photo:", snapshot, snapshot.photoId);
            this.beginPhotoDataTransfer(snapshot);
        } else {
            console.log(" ---> Done sending unsent photos");
        }
    }
    
    onWriteRequest(data, offset, withoutResponse, callback) {
        this._value = data;

        console.log(' ---> PhotoData onWriteRequest: value = ' + this._value.toString('hex'));

        if (this._updateValueCallback) {
            console.log(' ---> PhotoData onWriteRequest: notifying');

            this._updateValueCallback(this._value);
        }

        callback(this.RESULT_SUCCESS);
    }
    
    onSubscribe(maxValueSize, updateValueCallback) {
        console.log(' ---> PhotoData subscribe: Hello');

        this._updateValueCallback = updateValueCallback;

        this.snapshot = null;
        this.sendNextPhoto();
    }
    
    onUnsubscribe() {
        console.log(' ---> PhotoData unsubscribe: Good-bye');

        this._updateValueCallback = null;
        this.snapshot = null;
    }
}

util.inherits(SnapshotCharacteristic, bleno.Characteristic);
util.inherits(PhotoDataCharacteristic, bleno.Characteristic);

exports.BluetoothManager = BluetoothManager;