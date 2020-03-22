var gpio = require('rpi-gpio');
var override = 4;

gpio.setMode(gpio.MODE_BCM);
gpio.setup(override, gpio.DIR_OUT, gpio.EDGE_NONE, (err) => {
    if (err) {
        console.log(" ---> GPIO error", err);
    }
    console.log(' ---> Shutting down Comfort Maps Camera...');
    setInterval(() => {
        gpio.write(override, 0); // Good night
        process.exit(0)
    }, 1);
});
