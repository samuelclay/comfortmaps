//
//  LocationManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/17/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import CoreLocation

protocol LocationManagerDelegate {
    func didUpdateLocation()
}

class LocationManager: NSObject, CLLocationManagerDelegate {
    
    private let locationManager: CLLocationManager
    public var latestLocation: CLLocationCoordinate2D?
    public var latestHeading: CLLocationDirection?
    public var latestSpeed: CLLocationSpeed?
    private var delegates: [LocationManagerDelegate] = []
    
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
    
    func addDelegate(delegate: LocationManagerDelegate) {
        self.delegates.append(delegate)
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let locValue: CLLocationCoordinate2D = manager.location?.coordinate else { return }
//        print("location = \(locValue.latitude) \(locValue.longitude)")
        self.latestLocation = locValue
        
        guard let headingValue: CLLocationDirection = manager.location?.course else { return }
        self.latestHeading = headingValue
        
        guard let speedValue: CLLocationSpeed = manager.location?.speed else { return }
        self.latestSpeed = speedValue
        
        for delegate in delegates {
            delegate.didUpdateLocation()
        }
    }
    
}
