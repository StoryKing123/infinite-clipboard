use std::{
    net::UdpSocket,
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

    println!("1");
    //reset udp
    // let connection = clip_state.connection.lock().unwrap();
    // connection.unwrap().
    let bind_address = format!("0.0.0.0:{:?}", config.port.unwrap());
    // let bind_address = format!("0.0.0.0:8000", );

    println!("adddress:{:?}", bind_address);
    // let socket = UdpSocket::bind("0.0.0.0:8000").expect("bind failed");
    let socket = UdpSocket::bind(bind_address).expect("bind failed");

    socket.set_broadcast(true);
    // *state.connection.lock().unwrap() = Some(socket);
    *clip_state.connection.lock().unwrap() = Some(socket);

    let arc_app = Arc::new(Mutex::new(app));
    let app1 = Arc::clone(&arc_app);
    let udp_socket = clip_state
        .connection
        .clone()
        .lock()
        .unwrap()
        .as_ref()
        .unwrap()
        .try_clone()
        .unwrap();

    listen_connection(udp_socket, app1);
    println!("2");

    ()
}
