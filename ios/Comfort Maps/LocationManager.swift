//
//  LocationManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/17/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import CoreLocation

class LocationManager: NSObject, CLLocationManagerDelegate {
    
    private let locationManager: CLLocationManager
    public var latestLocation: CLLocationCoordinate2D?
    
    override init() {
        
        self.locationManager = CLLocationManager()
        
        super.init()
        
        // Ask for Authorisation from the User.
        self.locationManager.requestAlwaysAuthorization()

        // For use in foreground
        self.locationManager.requestWhenInUseAuthorization()

        if CLLocationManager.locationServicesEnabled() {
            locationManager.delegate = self
            locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
            locationManager.startUpdatingLocation()
        }
        
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let locValue: CLLocationCoordinate2D = manager.location?.coordinate else { return }
        print("location = \(locValue.latitude) \(locValue.longitude)")
        self.latestLocation = locValue
    }
    
}
