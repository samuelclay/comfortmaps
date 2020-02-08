var bleno = require('bleno');
var util = require('util');

var serviceUuids = ["ec20"]

class BluetoothManager {
    constructor() {
        bleno.on('stateChange', (state) => {
            console.log(" ---> Bluetooth: ", state);
            
            if (state == "poweredOn") {
                bleno.startAdvertising("Comfort Maps Camera", serviceUuid)
            } else {
                bleno.stopAdvertising();
            }
        });
        
        bleno.on('advertisingStart', (error) => {
            console.log(" ---> Advertising start: ", (error ? 'error ' + error : 'success'));
            
            if (!error) {
                bleno.setServices([
                    new BlenoPrimaryService({
                        uuid: 'ec20',
                        characteristics: [
                            new CameraCharacteristic()
                        ]
                    })
                ]);
            }
        });
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
    
    onReadRequest(offset, callback) {
        console.log('EchoCharacteristic - onReadRequest: value = ' + this._value.toString('hex'));

        callback(this.RESULT_SUCCESS, this._value);
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