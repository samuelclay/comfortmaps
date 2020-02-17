//
//  PhotoManager.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/8/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import UIKit

protocol PhotoDelegate {
    func beginBluetoothPhotoTransfer(header: String)
    func beginWifiPhotoTransfer(header: String)
    func receivePhotoData(data: Data)
    func endPhotoTransfer()
}

class PhotoManager: PhotoDelegate {
    private var uploadingData           : Data         = Data()
    private var currentImageSize        : Int          = 0
    private var currentChannel          : Int          = 0
    private var imageStartTime          : TimeInterval = 0
    private var imageElapsedTime        : TimeInterval = 0
    private var streamStartTime         : TimeInterval = 0
    private var transferRate            : Double       = 0
    
    func beginBluetoothPhotoTransfer(header: String) {
        print(" ---> Beginning photo transfer: \(header)")
        uploadingData = Data()
        imageStartTime = Date().timeIntervalSince1970
        transferRate = 0
        let headers = header.components(separatedBy: ":").map { (a) -> Int in
            if a == "BEG" {
                return 0
            } else {
                return Int(a)!
            }
        }
        currentImageSize = headers[2]
        currentChannel = headers[1]
    }
    
    func beginWifiPhotoTransfer(header: String) {
        
    }
    
    func receivePhotoData(data: Data) {
        uploadingData.append(data)
        imageElapsedTime = Date().timeIntervalSince1970 - imageStartTime
        transferRate = Double(uploadingData.count) / imageElapsedTime * 8.0 / 1000.0
        
        if uploadingData.count == currentImageSize {
            let image = UIImage.init(data: uploadingData)
            print(" ---> Done!", image ?? "???")
            self.endPhotoTransfer()
        } else {
            print(" ---> Progress:", uploadingData.count, currentImageSize)
        }
    }
    
    func endPhotoTransfer() {
        print("Done uploading photo", uploadingData)
        uploadingData = Data()
    }
}
