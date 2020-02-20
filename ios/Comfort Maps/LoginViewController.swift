//
//  LoginViewController.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/20/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import Foundation
import UIKit
import Alamofire

class LoginViewController : UIViewController {
    
    @IBOutlet weak var emailInput: UITextField!
    @IBOutlet weak var loginButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    // MARK: Actions
    @IBAction func submitLogin(_ sender: Any) {
        let params = ["email": emailInput.text];
        AF.request("https://comfortmaps.com/accounts/login_ajax/",
                   method: .post, parameters: params).responseJSON { response in
            print(" ---> Login response", response)
            if let result = response.value as? [String: Any],
                let code = result["code"] as? Int {
                if code == -1 {
                    if let message = result["error"] as? String {
                        let alert = UIAlertController(title: "Problem registering", message: message,
                                                      preferredStyle: UIAlertController.Style.alert)
                        alert.addAction(UIAlertAction(title: "Ok", style: UIAlertAction.Style.default,
                                                      handler: nil))
                        self.present(alert, animated: true, completion: nil)
                    }
                } else {
                    if let headerFields = response.response?.allHeaderFields as? [String: String],
                        let URL = response.request?.url
                    {
                        let cookies = HTTPCookie.cookies(withResponseHeaderFields: headerFields, for: URL)
                        for cookie in cookies {
                            if cookie.name == "sessionid" {
                                print(" ---> Cookie: ", cookie)
                                UserDefaults.standard.set(cookie.value, forKey: "CM:login-cookie")
                                self.dismiss(animated: true)
                            }
                        }
                    }
                    
                }
            }
        }
    }
    
    
}
