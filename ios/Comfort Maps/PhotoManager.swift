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
import AudioToolbox

protocol PhotoDelegate {
    func beginSnapshotTransfer(header: String)
    func beginBluetoothPhotoTransfer(header: String)
    func beginWifiPhotoTransfer(header: String)
    func receivePhotoData(data: Data)
    func receiveSnapshotData(data: Data)
    func endPhotoTransfer()
    func endSnapshotTransfer()
}

protocol PhotoUploadDelegate {
    func endSnapshotUpload()
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
    var heading: Double?
    var speed: Double?
    
    init(_ dictionary: [String: Any]) {
        self.photoId = dictionary["id"] as! String
        self.rating = dictionary["rating"] as! Int
        self.acceleration = dictionary["acceleration"] as? [String: Int] ?? Dictionary()
    }
    
    private enum CodingKeys: String, CodingKey {
        case photoId = "photo_id", rating, acceleration, coords = "gps", heading, speed = "speed_mph"
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
    private var currentHeading          : CLLocationDirection?
    private var currentSpeed            : CLLocationSpeed?
    private var currentPhotoId          : String       = String()
    private var delegates: [PhotoUploadDelegate] = []
    
    func addDelegate(delegate: PhotoUploadDelegate) {
        self.delegates.append(delegate)
    }
    
    func beginSnapshotTransfer(header: String) {
        print(" ---> Beginning snapshot transfer:", header)
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)

        currentCoords = appDelegate().locationManager.latestLocation
        currentHeading = appDelegate().locationManager.latestHeading
        currentSpeed = appDelegate().locationManager.latestSpeed
        
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

        if let heading = currentHeading {
            snapshot.heading = heading
        } else if let heading = appDelegate().locationManager.latestHeading {
            snapshot.heading = heading
        } else {
            print(" ---> Error, could not retrieve GPS heading!")
        }

        if let speed = currentSpeed {
            snapshot.speed = speed * 2.23694 // m/s -> mph
        } else if let speed = appDelegate().locationManager.latestSpeed {
            snapshot.speed = speed * 2.23694 // m/s -> mph
        } else {
            print(" ---> Error, could not retrieve GPS speed!")
        }

        AF.request("https://comfortmaps.com/record/snapshot/", method: .post, parameters: snapshot,
                   encoder: URLEncodedFormParameterEncoder.default)
            .validate(statusCode: 200..<300)
            .responseJSON { response in
                print(" ---> Snapshot response:", snapshot, response, response.result)
                switch response.result {
                case let .success(value):
                    if let json = value as? [String: Any] {
                        print("Record snapshot: \(json)")
                        for delegate in self.delegates {
                            delegate.endSnapshotUpload()
                        }
                    }
                case let .failure(error):
                    print("Record snapshot error: \(error)")
                    appDelegate().window?.rootViewController?.performSegue(withIdentifier: "presentLogin", sender: self)

                }
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
            print(" ---> Photo progress:", uploadingData.count, currentImageSize)
        }
    }

    func endPhotoTransfer() {
        guard let image = UIImage.init(data: uploadingData) else {
            print(" ---> Error in photo", uploadingData)
            return
        }
        print(" ---> Photo Done!", uploadingData.count, currentImageSize, image)
        let url = "https://comfortmaps.com/record/snapshot/photo/\(currentPhotoId)/"
        AF.upload(multipartFormData: { (mfd) in
            mfd.append(self.uploadingData, withName: "photo", fileName: "photo.jpg", mimeType: "image/jpeg")
        }, to: url)
            .uploadProgress { progress in
                print("Upload Progress: \(progress.fractionCompleted)")
            }
            .responseJSON { response in
                debugPrint(response)
//                AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
            }
        uploadingData = Data()
    }
}
