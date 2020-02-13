var bleno = require('bleno');
var util = require('util');

var serviceUuids = ["ec20"]

class BluetoothManager {    
    constructor(camera) {
        this.camera = camera;
        this.photoDataCharacteristic = new CameraCharacteristic()
        
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
                            this.photoDataCharacteristic
                        ]
                    })
                ]);
            }
        });
    }
    
    sendPhoto(snapshot, photo) {
        this.photoDataCharacteristic.beginPhotoDataTransfer(snapshot, photo);
    }

}

class CameraCharacteristic {
    constructor() {
        CameraCharacteristic.super_.call(this, {
            uuid: 'ec2e',
            properties: ['read', 'write', 'notify'],
            value: null
        });
        
        this._value = new Buffer(0);
        this._updateValueCallback = null;
    }
    
    beginPhotoDataTransfer(snapshot, photo) {
        this.photo = photo;
        this.snapshot = snapshot;
        this.bytesRead = 0;
        this.chunkSize = 20;
        this.photoSize = photo.length;
        
        if (this._updateValueCallback) {
            const message = "BEG:" + snapshot.rating + ":" + this.photoSize;
            this._value = Buffer.from(message, 'utf8');
            console.log(' ---> Notifying for photo transfer: ', message);
            this._updateValueCallback(this._value);
        }
    }
    
    onReadRequest(offset, callback) {
        // console.log(' ---> Reading', this.bytesRead, this.photoSize, this._value.toString('hex'));
        this._value = this.photo.slice(this.bytesRead, this.bytesRead + this.chunkSize);
        this.bytesRead += this.chunkSize;
        callback(this.RESULT_SUCCESS, this._value);
        if (this.bytesRead >= this.photoSize) {
            if (this._updateValueCallback) {
                const message = "END:" + this.photoSize;
                this._value = Buffer.from(message, 'utf8');
                console.log(' ---> Ending photo transfer: ', message);
                this._updateValueCallback(this._value);
            }
        }
    }
    
    onWriteRequest(data, offset, withoutResponse, callback) {
        this._value = data;

        console.log('EchoCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));

        if (this._updateValueCallback) {
            console.log('EchoCharacteristic - onWriteRequest: notifying');

            this._updateValueCallback(this._value);
        }

        callback(this.RESULT_SUCCESS);
    }
    
    onSubscribe(maxValueSize, updateValueCallback) {
        console.log('EchoCharacteristic - onSubscribe');

        this._updateValueCallback = updateValueCallback;
    }
    
    onUnsubscribe() {
        console.log('EchoCharacteristic - onUnsubscribe');

        this._updateValueCallback = null;
    }
}

util.inherits(CameraCharacteristic, bleno.Characteristic);

exports.BluetoothManager = BluetoothManager;