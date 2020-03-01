//
//  MapViewController.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/20/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import UIKit
import Mapbox

class MapViewController: UIViewController, LocationManagerDelegate, MGLMapViewDelegate {
    
    @IBOutlet weak var mapView: MGLMapView!
    private var lastLocation: CLLocationCoordinate2D?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.mapView.delegate = self
        appDelegate().locationManager.addDelegate(delegate: self)
        self.center(animated: false)
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
        
        if distance > 50 {
            print(" ---> Moved \(distance) meters, recentering...")
            self.center()
        } else {
//            print(" ---> Only moved \(distance) meters")
        }
    }
    
    func center(animated: Bool = true) {
        if let location = appDelegate().locationManager.latestLocation {
            self.lastLocation = location
            self.mapView.setCenter(location, zoomLevel: 13, animated: animated)
        }
    }
    
    func mapViewWillStartLoadingMap(_ mapView: MGLMapView) {
        print(" ---> Loading map...")
    }
    
    func mapViewDidFailLoadingMap(_ mapView: MGLMapView, withError error: Error) {
        print(" ---> Failed to load map:", error)
    }
    
    func mapView(_ mapView: MGLMapView, didFinishLoading style: MGLStyle) {
        // Parse GeoJSON data. This example uses all M1.0+ earthquakes from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
//        guard let url = URL(string: "https://www.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson") else { return }
        guard let location = appDelegate().locationManager.latestLocation else { return }
        guard let url = URL(string: "https://comfortmaps.com/record/snapshots_from_point.geojson?lat=\(location.latitude)&lng=\(location.longitude)") else { return }
        let source = MGLShapeSource(identifier: "snapshots", url: url, options: nil)
        style.addSource(source)
         
        // Create a heatmap layer.
        let heatmapLayer = MGLHeatmapStyleLayer(identifier: "snapshots", source: source)
         
        // Adjust the color of the heatmap based on the point density.
        let colorDictionary: [NSNumber: UIColor] = [
            0.0: .clear,
            0.01: UIColor(red: 0.73, green: 0.43, blue: 0.40, alpha: 1.0),
            0.15: .yellow,
            0.5: UIColor(red: 0.39, green: 0.80, blue: 0.25, alpha: 1.0),
            1: UIColor(red: 0.19, green: 0.80, blue: 0.30, alpha: 1.0)
        ]
        heatmapLayer.heatmapColor = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:($heatmapDensity, 'linear', nil, %@)", colorDictionary)
         
        // Heatmap weight measures how much a single data point impacts the layer's appearance.
        heatmapLayer.heatmapWeight = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:(rating, 'linear', nil, %@)",
        [0: 0,
        6: 1])
         
        // Heatmap intensity multiplies the heatmap weight based on zoom level.
        heatmapLayer.heatmapIntensity = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:($zoomLevel, 'linear', nil, %@)",
        [0: 1,
        9: 3])
        heatmapLayer.heatmapRadius = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:($zoomLevel, 'linear', nil, %@)",
        [0: 4,
        9: 30])
         
        // The heatmap layer should be visible up to zoom level 9.
        heatmapLayer.heatmapOpacity = NSExpression(format: "mgl_step:from:stops:($zoomLevel, 0.75, %@)", [0: 0.75, 9: 0])
        style.addLayer(heatmapLayer)
         
        // Add a circle layer to represent the earthquakes at higher zoom levels.
        let circleLayer = MGLCircleStyleLayer(identifier: "circle-layer", source: source)
         
        let magnitudeDictionary: [NSNumber: UIColor] = [
        1: UIColor(red: 0.73, green: 0.23, blue: 0.20, alpha: 1.0),
        2: UIColor(red: 0.73, green: 0.43, blue: 0.40, alpha: 1.0),
        3: .yellow,
        4: UIColor(red: 0.39, green: 0.80, blue: 0.25, alpha: 1.0),
        5: UIColor(red: 0.19, green: 0.80, blue: 0.30, alpha: 1.0)
        ]
        circleLayer.circleColor = NSExpression(format: "mgl_interpolate:withCurveType:parameters:stops:(rating, 'linear', nil, %@)", magnitudeDictionary)
         
        // The heatmap layer will have an opacity of 0.75 up to zoom level 9, when the opacity becomes 0.
        circleLayer.circleOpacity = NSExpression(format: "mgl_step:from:stops:($zoomLevel, 0, %@)", [0: 0, 9: 0.75])
        circleLayer.circleRadius = NSExpression(forConstantValue: 20)
        style.addLayer(circleLayer)
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
