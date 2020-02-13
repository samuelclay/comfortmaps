const ButtonManager = require('./button-manager').ButtonManager;
const BluetoothManager = require('./bluetooth-manager').BluetoothManager;
const WifiManager = require('./wifi-manager').WifiManager;
const { DatabaseManager, Snapshot } = require('./database-manager');


console.log(' ---> Starting Comfort Maps...');
var databaseManager = new DatabaseManager();
var buttonManager = new ButtonManager();
var bluetoothManager = new BluetoothManager();
var wifiManager = new WifiManager();
console.log(' ---> Running Comfort Maps', buttonManager.buttons);
