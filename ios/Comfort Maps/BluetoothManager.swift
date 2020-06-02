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
    public static let CharacteristicSnapshotUUID = CBUUID.init(string: "ec2d")
}

protocol BluetoothManagerDelegate {
    func bluetoothMessageUpdated(_ message: String, connected: Bool)
}

class BluetoothManager: NSObject, CBPeripheralDelegate, CBCentralManagerDelegate {
    private var centralManager: CBCentralManager!
    private var peripheral: CBPeripheral!
    public var photoDelegate: PhotoBluetoothDelegate?
    private var delegates: [BluetoothManagerDelegate] = []
    fileprivate let snapshotData = NSMutableData()
    
    override init() {
        super.init()
        
        self.centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func addDelegate(delegate: BluetoothManagerDelegate) {
        self.delegates.append(delegate)
    }
    
    func updateMessage(_ message: String, connected: Bool) {
        for delegate in self.delegates {
            delegate.bluetoothMessageUpdated(message, connected: connected)
        }
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state != .poweredOn {
            print("Bluetooth not powered on")
            self.updateMessage("❌ Bluetooth not powered on", connected: false)
        } else {
            self.centralManager.scanForPeripherals(withServices: [ComfortmapsCamera.ServiceUUID], options: [:])
            self.updateMessage("🕵️‍♂️ Scanning for cameras...", connected: false)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        self.centralManager.stopScan()
        print(" ---> Found peripheral: ", peripheral)
        self.peripheral = peripheral
        self.peripheral.delegate = self
        self.updateMessage("📷 Connecting to camera...", connected: false)
        self.centralManager.connect(self.peripheral, options: nil)
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        if peripheral == self.peripheral {
            self.snapshotData.length = 0
            print(" ---> Connected to peripheral: ", peripheral)
            self.updateMessage("📷 Discovering services...", connected: true)
            peripheral.discoverServices([ComfortmapsCamera.ServiceUUID])
        }
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print(" ---> Disconnected: ", peripheral)
        self.updateMessage("❌ Disconnected from camera...", connected: false)
        self.centralManagerDidUpdateState(central)
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil else {
            print(" ---> Error discovering services: \(error!.localizedDescription)")
            cleanup()
            return
        }
        
        guard let services = peripheral.services else {
            print(" ***> Error, no services")
            return
        }
        print(" ---> Discovered services: ", services)
        self.updateMessage("📷 Discovered \(services.count) services...", connected: true)

        for service in services {
            if service.uuid == ComfortmapsCamera.ServiceUUID {
                peripheral.discoverCharacteristics([ComfortmapsCamera.CharacteristicPhotoDataUUID,
                                                    ComfortmapsCamera.CharacteristicSnapshotUUID], for: service)
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil else {
            print(" ---> Error discovering characteristics: \(error!.localizedDescription)")
            cleanup()
            return
        }
        
        print(" ---> Discovered characteristics: ", service.characteristics ?? "nil")
        if let characteristics = service.characteristics {
            self.updateMessage("📷 Discovered \(characteristics.count) characteristics...", connected: true)
            for characteristic in characteristics {
                switch characteristic.uuid {
                case ComfortmapsCamera.CharacteristicPhotoDataUUID:
                    peripheral.setNotifyValue(true, for: characteristic)
                case ComfortmapsCamera.CharacteristicSnapshotUUID:
                    peripheral.setNotifyValue(true, for: characteristic)
                default:
                    break
                }
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print(" ***> Error in characteristic:", error)
        }
        
        if characteristic.uuid == ComfortmapsCamera.CharacteristicPhotoDataUUID {
            self.updatePhotoData(peripheral, characteristic)
        }
        
        if characteristic.uuid == ComfortmapsCamera.CharacteristicSnapshotUUID {
            self.updateSnapshotData(peripheral, characteristic)
        }
    }
    
    func updateSnapshotData(_ peripheral: CBPeripheral, _ characteristic: CBCharacteristic) {
        guard let data = characteristic.value else {
            print(" ---> Invalid data")
            self.photoDelegate?.endSnapshotTransfer()
            return
        }
        
        let subdata = data[data.startIndex..<data.index(data.startIndex, offsetBy: min(data.count, 2))]
        if subdata == "S:".data(using: .utf8) {
            self.updateMessage("🤳 Receiving snapshot...", connected: true)
            if let dataString = String(bytes: data, encoding: .utf8) {
                self.photoDelegate?.beginSnapshotTransfer(header: dataString)
            }
            peripheral.readValue(for: characteristic)
        } else if subdata.count == 0 {
            self.updateMessage("🤳 Received snapshot!", connected: true)
            self.photoDelegate?.endSnapshotTransfer()
        } else {
            self.photoDelegate?.receiveSnapshotData(data: data)
            peripheral.readValue(for: characteristic)
        }
    }
    
    func updatePhotoData(_ peripheral: CBPeripheral, _ characteristic: CBCharacteristic) {
        guard let photoDelegate = self.photoDelegate else { return }
        guard let data = characteristic.value else {
            print(" ---> Invalid data")
            photoDelegate.endPhotoTransfer()
            return
        }
        
//        print(" ---> Received data:", data.map { String(format: "%02x", $0) }.joined(), data, dataString)
        let subdata = data.subdata(in: 0..<min(data.count, 2))
        if subdata == "B:".data(using: .utf8) {
            self.updateMessage("🤳 Receiving photo...", connected: true)
            if let dataString = String(bytes: data, encoding: .utf8) {
                photoDelegate.beginBluetoothPhotoTransfer(header: dataString)
            }
            peripheral.readValue(for: characteristic)
        } else if subdata.count == 0 {
            self.updateMessage("🤳 Received photo!", connected: true)
            photoDelegate.endPhotoTransfer()
        } else {
            let pct = Int(round(photoDelegate.receivePhotoData(data: data) * 100))
            self.updateMessage("🤳 Receiving photo: \(pct)%", connected: true)
            peripheral.readValue(for: characteristic)
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
        if characteristic.isNotifying {
            print(" ---> Notification begin on", characteristic)
            self.updateMessage("📸 Connected to camera", connected: true)
        } else {
            print(" ---> Notification ended on", characteristic)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print(" ---> Failed to connect to", peripheral, error!.localizedDescription)

        cleanup()
    }
    
    /** Call this when things either go wrong, or you're done with the connection.
    *  This cancels any subscriptions if there are any, or straight disconnects if not.
    *  (didUpdateNotificationStateForCharacteristic will cancel the connection if a subscription is involved)
    */
    fileprivate func cleanup() {
        // Don't do anything if we're not connected
        // self.discoveredPeripheral.isConnected is deprecated
        guard peripheral?.state == .connected else {
            return
        }
        
        // See if we are subscribed to a characteristic on the peripheral
        guard let services = peripheral?.services else {
            centralManager.cancelPeripheralConnection(peripheral)
            return
        }

        for service in services {
            guard let characteristics = service.characteristics else {
                continue
            }

            for characteristic in characteristics {
                if characteristic.uuid.isEqual(ComfortmapsCamera.CharacteristicPhotoDataUUID) && characteristic.isNotifying {
                    peripheral?.setNotifyValue(false, for: characteristic)
                }
                if characteristic.uuid.isEqual(ComfortmapsCamera.CharacteristicSnapshotUUID) && characteristic.isNotifying {
                    peripheral?.setNotifyValue(false, for: characteristic)
                }
            }
        }
    }
}
