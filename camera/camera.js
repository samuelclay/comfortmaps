const ButtonManager = require('./button-manager').ButtonManager;
const BluetoothManager = require('./bluetooth-manager').BluetoothManager;
const WifiManager = require('./wifi-manager').WifiManager;
const { DatabaseManager, Snapshot } = require('./database-manager');


console.log(' ---> Starting Comfort Maps...');
var camera = {};
camera.databaseManager = new DatabaseManager(camera);
camera.buttonManager = new ButtonManager(camera);
camera.bluetoothManager = new BluetoothManager(camera);
camera.wifiManager = new WifiManager(camera);
console.log(' ---> Running Comfort Maps', camera.buttonManager.buttons);
