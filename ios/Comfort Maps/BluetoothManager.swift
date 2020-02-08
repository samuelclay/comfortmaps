//
//  BluetoothManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/8/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import CoreBluetooth

struct ComfortmapsCamera {
    public static let ServiceUUID = CBUUID.init(string: "ec20")
    public static let CharacteristicPhotoDataUUID = CBUUID.init(string: "ec2e")
}

class BluetoothManager: NSObject, CBPeripheralDelegate, CBCentralManagerDelegate {
    private var centralManager: CBCentralManager!
    private var peripheral: CBPeripheral!
    public var photoDelegate: PhotoDelegate?
    
    override init() {
        super.init()
        
        self.centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state != .poweredOn {
            print("Bluetooth not powered on")
        } else {
            self.centralManager.scanForPeripherals(withServices: [ComfortmapsCamera.ServiceUUID], options: [:])
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        self.centralManager.stopScan()
        
        self.peripheral = peripheral
        self.peripheral.delegate = self
        
        self.centralManager.connect(self.peripheral, options: nil)
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        if peripheral == self.peripheral {
            peripheral.discoverServices([ComfortmapsCamera.ServiceUUID])
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        self.centralManagerDidUpdateState(central)
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let services = peripheral.services {
            for service in services {
                if service.uuid == ComfortmapsCamera.ServiceUUID {
                    peripheral.discoverCharacteristics([ComfortmapsCamera.CharacteristicPhotoDataUUID], for: service)
                }
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let characteristics = service.characteristics {
            for characteristic in characteristics {
                if characteristic.uuid == ComfortmapsCamera.CharacteristicPhotoDataUUID {
                    peripheral.setNotifyValue(true, for: characteristic)
                }
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print(" ***> Error in characteristic:", error)
        }
        self.updatePhotoData(peripheral, characteristic)
    }
    
    func updatePhotoData(_ peripheral: CBPeripheral, _ characteristic: CBCharacteristic) {
        if characteristic.uuid == ComfortmapsCamera.CharacteristicPhotoDataUUID {
            if let data = characteristic.value {
                if let dataString = String(bytes: data, encoding: .utf8) {
//                    print(" ---> Received data:", data.map { String(format: "%02x", $0) }.joined(), data, dataString)
                    if dataString.starts(with: "BEG:") {
                        self.photoDelegate?.beginPhotoTransfer(header: dataString)
                        peripheral.readValue(for: characteristic)
                    } else if dataString.starts(with: "END:") {
                        self.photoDelegate?.endPhotoTransfer()
                    } else {
                        self.photoDelegate?.receivePhotoData(data: data)
                        peripheral.readValue(for: characteristic)
                    }
                } else {
                    self.photoDelegate?.receivePhotoData(data: data)
                    peripheral.readValue(for: characteristic)
                }
            } else {
                self.photoDelegate?.endPhotoTransfer()
            }
        }

    }
}
