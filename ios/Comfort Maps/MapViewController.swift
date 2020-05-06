//
//  MapViewController.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/20/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import UIKit
import Mapbox

class MapViewController: UIViewController, LocationManagerDelegate, MGLMapViewDelegate, PhotoUploadDelegate, BluetoothManagerDelegate {
    
    @IBOutlet weak var mapView: MGLMapView!
    @IBOutlet weak var bluetoothView: UIView!
    @IBOutlet weak var bluetoothMessage: UILabel!
    private var lastLocation: CLLocationCoordinate2D?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.mapView.delegate = self
        self.mapView.showsUserLocation = true
        appDelegate().locationManager.addDelegate(delegate: self)
        appDelegate().photoManager.addDelegate(delegate: self)
        appDelegate().bluetoothManager.addDelegate(delegate: self)
        self.center(animated: false)
//        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
//            self.reloadMap()
//        }
    }
    
    func didUpdateLocation() {
        guard let lastLoc = self.lastLocation else {
            self.center()
            return
        }
        guard let recentLocation = appDelegate().locationManager.latestLocation else {
            return
        }
        let oldLocation = CLLocation(latitude: lastLoc.latitude, longitude: lastLoc.longitude)
        let newLocation = CLLocation(latitude: recentLocation.latitude, longitude: recentLocation.longitude)
        let distance = newLocation.distance(from: oldLocation)
        
        if distance > 10 {
            print(" ---> Moved \(distance) meters, recentering...")
            self.center()
        } else {
//            print(" ---> Only moved \(distance) meters")
        }
    }
    
    @objc func reloadMap() {
        guard let style = self.mapView.style else { return }
        if let source = style.source(withIdentifier: "snapshots") as? MGLShapeSource {
            if let url = source.url {
                source.url = url
            }
        }
    }
    
    func loadMap() {
        guard let style = self.mapView.style else {
            return
        }
        
        guard let location = appDelegate().locationManager.latestLocation else { return }
        guard let url = URL(string: "https://comfortmaps.com/record/snapshots_from_point.geojson?lat=\(location.latitude)&lng=\(location.longitude)") else { return }
        let source = MGLShapeSource(identifier: "snapshots", url: url, options: nil)
        style.addSource(source)
        
        // Add a circle layer to represent the earthquakes at higher zoom levels.
        let circleLayer = MGLCircleStyleLayer(identifier: "snapshot-points", source: source)
         
        let magnitudeDictionary: [NSNumber: UIColor] = [
            1: UIColor(red: 186/255, green: 56/255, blue: 51/255, alpha: 1.0),
            2: UIColor(red: 186/255, green: 110/255, blue: 102/255, alpha: 1.0),
            3: UIColor(red: 255/255, green: 227/255, blue: 136/255, alpha: 1.0),
            4: UIColor(red: 100/255, green: 204/255, blue: 64/255, alpha: 1.0),
            5: UIColor(red: 48/255, green: 204/255, blue: 76/255, alpha: 1.0)
        ]
        circleLayer.circleColor = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:(rating, 'linear', nil, %@)", magnitudeDictionary)
         
        // The heatmap layer will have an opacity of 0.75 up to zoom level 9, when the opacity becomes 0.
        circleLayer.circleOpacity = NSExpression(format: "mgl_step:from:stops:($zoomLevel, 0, %@)", [0: 0, 9: 1])
        circleLayer.circleRadius = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:($zoomLevel, 'linear', 0.1, %@)", [9: 1, 15: 6, 17: 12])
        style.addLayer(circleLayer)
            
        if let cambridge = style.layer(withIdentifier: "cambridge-ma-bike-facilities") as? MGLLineStyleLayer {
            cambridge.lineOpacity = NSExpression(format: "mgl_step:from:stops:($zoomLevel, 0, %@)", [0: 0.1, 9: 0.4])
    //            cambridge.lineOpacity = NSExpression(forConstantValue: 0.4)
            cambridge.isVisible = true
        }
        if let boston = style.layer(withIdentifier: "boston-ma-existing-bike-network") as? MGLLineStyleLayer {
            boston.lineOpacity = NSExpression(forConstantValue: 0.4)
            boston.isVisible = true
        }
    }
    
    func endSnapshotUpload() {
        self.reloadMap()
    }
    
    func center(animated: Bool = true) {
        if let location = appDelegate().locationManager.latestLocation {
            self.lastLocation = location
            var zoomLevel = self.mapView.zoomLevel
            if zoomLevel < 12 {
                zoomLevel = 14
            }
            self.mapView.setCenter(location, zoomLevel: zoomLevel, animated: animated)
        }
    }
    
    func mapViewWillStartLoadingMap(_ mapView: MGLMapView) {
        print(" ---> Loading map...")
    }
    
    func mapViewDidFailLoadingMap(_ mapView: MGLMapView, withError error: Error) {
        print(" ---> Failed to load map:", error)
    }
    
    func mapView(_ mapView: MGLMapView, didFinishLoading style: MGLStyle) {
        self.loadMap()
    }
    
    func bluetoothMessageUpdated(_ message: String, connected: Bool) {
        if connected {
            self.bluetoothView.backgroundColor = UIColor.blue
        } else {
            self.bluetoothView.backgroundColor = UIColor.red
        }

        self.bluetoothMessage.text = message
    }

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
