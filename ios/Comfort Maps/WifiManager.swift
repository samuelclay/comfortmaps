//
//  WifiManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/12/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import NetworkExtension

class WifiManager: NSObject {
    public var photoDelegate: PhotoDelegate?
    
    override init() {
        super.init()
        
//        self.connect()
    }
    
    func connect() {
        let hotspotConfig = NEHotspotConfiguration(ssid: "Comfort Maps Camera",
                                                   passphrase: "AardvarkBadgerHedgehog",
                                                   isWEP: false)
        hotspotConfig.joinOnce = false
        NEHotspotConfigurationManager.shared.apply(hotspotConfig) { (error) in
            if let error = error {
                print(" ---> Wifi error: ", error)
            } else {
                print(" ---> Connected over wifi")
            }
        }
    }
}
