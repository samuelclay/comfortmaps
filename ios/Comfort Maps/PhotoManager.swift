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
import Alamofire

protocol PhotoDelegate {
    func beginSnapshotTransfer(header: String)
    func beginBluetoothPhotoTransfer(header: String)
    func beginWifiPhotoTransfer(header: String)
    func receivePhotoData(data: Data)
    func receiveSnapshotData(data: Data)
    func endPhotoTransfer()
    func endSnapshotTransfer()
}

struct Coordinate: Codable {
    var latitude: Double
    var longitude: Double
}

struct Snapshot: Codable {
    var photoId: String
    var rating: Int
    var acceleration: [String: Int]
    var coords: Coordinate?
    
    init(_ dictionary: [String: Any]) {
        self.photoId = dictionary["id"] as! String
        self.rating = dictionary["rating"] as! Int
        self.acceleration = dictionary["acceleration"] as? [String: Int] ?? Dictionary()
    }
    
    private enum CodingKeys: String, CodingKey {
        case photoId = "photo_id", rating, acceleration, coords = "gps"
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
    private var currentCoords           : CLLocationCoordinate2D?
    private var currentPhotoId          : String       = String()
    
    func beginSnapshotTransfer(header: String) {
        print(" ---> Beginning snapshot transfer:", header)

        currentCoords = appDelegate().locationManager.latestLocation
        
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
//            print(" ---> Snapshot progress:", uploadingSnapshot.count, currentSnapshotSize)
        }
    }
        
    func endSnapshotTransfer() {
        guard let jsonResponse = try? JSONSerialization.jsonObject(with: uploadingSnapshot,
                                                                   options: []) else {
//            print(" ---> Bad uploaded snapshot", uploadingSnapshot)
            return
        }
        guard let json = jsonResponse as? [String: Any] else {
//            print(" ---> Bad uploaded snapshot", uploadingSnapshot)
            return
        }
        var snapshot = Snapshot(json)
        if let coords = currentCoords {
            snapshot.coords = Coordinate(latitude: coords.latitude, longitude: coords.longitude)
        } else if let coords = appDelegate().locationManager.latestLocation {
            snapshot.coords = Coordinate(latitude: coords.latitude, longitude: coords.longitude)
        } else {
            print(" ---> Error, could not retrieve GPS coordinates!")
        }
        
        AF.request("https://comfortmaps.com/record/snapshot/", method: .post, parameters: snapshot,
                   encoder: URLEncodedFormParameterEncoder.default).response { response in
            print(" ---> Snapshot response:", snapshot, response)
        }
//        print("Done uploading snapshot", uploadingSnapshot, snapshot)

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
//            print(" ---> Photo progress:", uploadingData.count, currentImageSize)
        }
    }

    func endPhotoTransfer() {
        guard let image = UIImage.init(data: uploadingData) else {
            print(" ---> Error in photo", uploadingData)
            return
        }
        guard let imageData = image.jpegData(compressionQuality: 1) else {
            print(" ---> Error in photo data", image)
            return
        }
        print(" ---> Photo Done!", uploadingData.count, currentImageSize, image)
        AF.upload(imageData, to: "https://comfortmaps.com/record/snapshot/photo/")
            .uploadProgress { progress in
                print("Upload Progress: \(progress.fractionCompleted)")
            }
            .responseJSON { response in
                debugPrint(response)
            }
        uploadingData = Data()
    }
}
