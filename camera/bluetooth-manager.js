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
    
    }
    
    onWriteRequest(data, offset, withoutResponse, callback) {
    
    }
}

util.inherits(CameraCharacteristic, bleno.Characteristic);

exports.BluetoothManager = BluetoothManager;