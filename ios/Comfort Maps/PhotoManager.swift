//
//  PhotoManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/8/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import UIKit
import CoreLocation

protocol PhotoDelegate {
    func beginSnapshotTransfer(header: String)
    func beginBluetoothPhotoTransfer(header: String)
    func beginWifiPhotoTransfer(header: String)
    func receivePhotoData(data: Data)
    func receiveSnapshotData(data: Data)
    func endPhotoTransfer()
    func endSnapshotTransfer()
}

struct Snapshot {
    var photoId: String
    var rating: Int
    var acceleration: [String: Int]
    
    init(_ dictionary: [String: Any]) {
        self.photoId = dictionary["id"] as! String
        self.rating = dictionary["rating"] as! Int
        self.acceleration = dictionary["acceleration"] as? [String: Int] ?? Dictionary()
    }
}
class PhotoManager: PhotoDelegate {
    private var uploadingData           : Data         = Data()
    private var uploadingSnapshot       : Data         = Data()
    private var currentImageSize        : Int          = 0
    private var currentSnapshotSize     : Int          = 0
    private var currentRating           : Int          = 0
    private var imageStartTime          : TimeInterval = 0
    private var imageElapsedTime        : TimeInterval = 0
    private var streamStartTime         : TimeInterval = 0
    private var transferRate            : Double       = 0
    private var currentCoords           : CLLocationCoordinate2D = CLLocationCoordinate2D()
    private var currentPhotoId          : String       = String()
    func beginSnapshotTransfer(header: String) {
        print(" ---> Beginning snapshot transfer:", header)

        let coords = appDelegate().locationManager.latestLocation
        
        uploadingSnapshot = Data()
        imageStartTime = Date().timeIntervalSince1970
        transferRate = 0
        let headers = header.components(separatedBy: ":")
        currentSnapshotSize = Int(headers[2])!
        currentRating = Int(headers[1])!
        currentPhotoId = String(headers[3])
    }
    
    func beginBluetoothPhotoTransfer(header: String) {
        print(" ---> Beginning photo transfer: \(header)")
        uploadingData = Data()
        imageStartTime = Date().timeIntervalSince1970
        transferRate = 0
        let headers = header.components(separatedBy: ":")
        currentImageSize = Int(headers[2])!
        currentRating = Int(headers[1])!
        currentPhotoId = String(headers[3])
    }
    
    func beginWifiPhotoTransfer(header: String) {
        
    }
    
    //
    // Snapshots
    //
    
    func receiveSnapshotData(data: Data) {
        uploadingSnapshot.append(data)
        
        if uploadingSnapshot.count == currentSnapshotSize {
            self.endSnapshotTransfer()
        } else {
            print(" ---> Snapshot progress:", uploadingSnapshot.count, currentSnapshotSize)
        }
    }
        
    func endSnapshotTransfer() {
        guard let jsonResponse = try? JSONSerialization.jsonObject(with: uploadingSnapshot, options: []) else {
            print(" ---> Bad uploaded snapshot", uploadingSnapshot)
            return
        }
        guard let json = jsonResponse as? [String: Any] else {
            print(" ---> Bad uploaded snapshot", uploadingSnapshot)
            return
        }
        var snapshot = Snapshot(json)
        
        
        print("Done uploading snapshot", uploadingSnapshot, snapshot)

        
        
        uploadingSnapshot = Data()
    }
    
    //
    // Photos
    //
    
    func receivePhotoData(data: Data) {
        uploadingData.append(data)
        imageElapsedTime = Date().timeIntervalSince1970 - imageStartTime
        transferRate = Double(uploadingData.count) / imageElapsedTime * 8.0 / 1000.0
        
        if uploadingData.count >= currentImageSize {
            self.endPhotoTransfer()
        } else {
            print(" ---> Photo progress:", uploadingData.count, currentImageSize)
        }
    }

    func endPhotoTransfer() {
        let image = UIImage.init(data: uploadingData)
        print(" ---> Photo Done!", uploadingData.count, currentImageSize, image ?? "???")
        uploadingData = Data()
    }
}
