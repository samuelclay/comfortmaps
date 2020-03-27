const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('/dev/serial0', { baudRate: 9600 });
// const parser = port.pipe(new Readline({ delimiter: '\n' }));
const parser = new Readline();
port.pipe(parser);

// Read the port data
parser.on('data', data =>{
  console.log('got word from arduino:', data);
});

port.on('readable', function () {
  console.log('Data:', port.read())
})
// Switches the port into "flowing mode"
port.on('data', function (data) {
  console.log('Data:', data)
})

port.on("open", () => {
  console.log('serial port open');
  port.write('p1\n', (err) => {
      if (err) {
          console.log('error writing', err);
      }
      console.log('wrote');
  });
});

port.write('r32\n');
