//
//  AppDelegate.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/8/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import UIKit
import CoreData

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    public var bluetoothManager: BluetoothManager!
    public var wifiManager: WifiManager!
    public var photoManager: PhotoManager!
    public var locationManager: LocationManager!
    private var bgTask: UIBackgroundTaskIdentifier!
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        self.locationManager = LocationManager()
        self.bluetoothManager = BluetoothManager()
        self.wifiManager = WifiManager()
        self.photoManager = PhotoManager()
        self.bluetoothManager.photoDelegate = self.photoManager
        self.wifiManager.photoDelegate = self.photoManager
        
        // Uncomment below to reset login
//        UserDefaults.standard.removeObject(forKey: "CM:login-cookie")

        return true
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        bgTask = application.beginBackgroundTask(withName: "ComfortMapsBG") {
            application.endBackgroundTask(self.bgTask)
            self.bgTask = UIBackgroundTaskIdentifier.invalid
        }
    }

}

func appDelegate() -> AppDelegate {
    return UIApplication.shared.delegate as! AppDelegate
}
