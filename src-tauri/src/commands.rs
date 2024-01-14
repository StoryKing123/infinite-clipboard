use std::{
    net::{SocketAddr, UdpSocket},
    ops::Deref,
    str::FromStr,
    sync::{Arc, Mutex},
};

use serde_json::Error;

use crate::{listen_connection, AppState, ClipboardState, Config};

#[tauri::command]
pub fn update_config(
    config_str: &str,
    state: tauri::State<AppState>,
    clip_state: tauri::State<ClipboardState>,
    app: tauri::AppHandle,
) {
    println!("{:?}", config_str);
    let config: Config = serde_json::from_str(config_str).unwrap();

    *state.config.lock().unwrap() = Some(config.clone());

    let mut arc_connection = Arc::clone(&clip_state.connection);
    {
        let mut connection = arc_connection.lock().unwrap();

        // let addr = connection.as_mut().unwrap().local_addr();
        // match addr {
        //     Ok(res) => {
        //         println!("addr:{:?}", res);
        //     }
        //     Err(_) => todo!(),
        // }
        let bind_address =
            SocketAddr::from_str(format!("0.0.0.0:{:?}", config.port.unwrap()).as_str()).unwrap();
        if connection.is_some() {
            let address = connection.as_ref().unwrap().local_addr().unwrap();
            // let prev_address = SocketAddr::from_str(config.port.unwrap());
            if address.eq(&bind_address) {
                return ();
            }
        }

        let socket = UdpSocket::bind(bind_address).expect("bind failed");

        // let clone_connection = Arc::clone(&clip_state.connection);
        // let mut connection = clone_connection.lock().unwrap();

        socket.set_broadcast(true);
        *connection = None;
        *connection = Some(socket);
    }

    listen_connection(app.clone());
    // println!("4444");
    // println!("2");

    ()
}
