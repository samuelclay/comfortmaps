//
//  MainTabBarController.swift
//  Comfort Maps
//
//  Created by Samuel Clay on 2/20/20.
//  Copyright © 2020 hackersmacker. All rights reserved.
//

import UIKit

class MainTabBarController: UITabBarController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
    }
    
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        
        // Do any additional setup after loading the view.
        guard (UserDefaults.standard.string(forKey: "CM:login-cookie") != nil) else {
            performSegue(withIdentifier: "presentLogin", sender: self)
            return
        }
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
