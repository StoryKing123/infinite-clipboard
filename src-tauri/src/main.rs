// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use core::time;
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream, UdpSocket},
    sync::{Arc, Mutex},
    thread::{self, sleep},
};
pub mod commands;

// use event::update_config;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{
    async_runtime::handle, utils::config::parse::parse_json, App, AppHandle, Context,
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_clipboard;

#[derive(Debug, Clone)]
struct ClipboardState {
    connection: Arc<Mutex<Option<UdpSocket>>>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]

struct Config {
    port: Option<i16>,
    ip_address: Option<Vec<String>>,
}
struct AppState {
    client_id: Arc<Mutex<String>>,
    config: Mutex<Option<Config>>,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

pub fn json_bytes<T>(structure: T) -> Vec<u8>
where
    T: Serialize,
{
    let mut bytes: Vec<u8> = Vec::new();
    serde_json::to_writer(&mut bytes, &structure).unwrap();
    bytes
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MessagePayload {
    value: String,
    client_id: String,
    id: String,
}

#[tauri::command]
fn set_client_id(id: &str, state: tauri::State<AppState>) {
    let mut client_id = state.client_id.lock().unwrap();
    println!("set client id:{:?}", id);
    *client_id = String::from(id);
}

#[tauri::command]
fn send_clipboard_event(
    value: &str,
    id: &str,
    state: tauri::State<ClipboardState>,
    app_state: tauri::State<AppState>,
) {
    println!("{:?}", value);
    println!("start send");

    let connection = state.connection.clone();
    let binding = connection.lock().unwrap();
    let socket = binding;

    let message_payload = MessagePayload {
        id: String::from(id),
        value: String::from(value),
        client_id: app_state.client_id.lock().unwrap().to_string(),
    };

    let json_body = json!(message_payload);
    let bytes = json_bytes(json_body);
    let address = app_state
        .config
        .lock()
        .unwrap()
        .clone()
        .unwrap()
        .ip_address
        .unwrap();

    for ip in address {
        println!("{:?}", &ip);
        // let res = socket.send_to(&bytes, "255.255.255.255:8000");
        let res = socket.as_ref().unwrap().send_to(&bytes, ip);
        println!("{:?}", res);
    }
    // let res = socket.send_to(value.as_bytes(), "255.255.255.255:8000");
    // connection.write(value.as_bytes()).unwrap();
    println!("send event");
}

// fn listen_connection(app: Arc<Mutex<AppHandle>>) {
fn listen_connection(app: AppHandle) {
    let app_context = app;
    let clip_state = app_context.state::<ClipboardState>();
    let window = app_context.get_window("main").unwrap();
    let handle = app_context.app_handle();
    // let c = Arc::clone(&clip_state.connection);
    let mut udp_socket = clip_state.connection.lock().unwrap();
    let mut udp_socket = udp_socket.as_mut().unwrap();
    let udp_socket = udp_socket.try_clone().unwrap();

    thread::spawn(move || {
        udp_socket.set_broadcast(true);
        // let clipboard = handle.state::<tauri_plugin_clipboard::ClipboardManager>();
        let state = handle.state::<AppState>().clone();
        loop {
            let mut buf = [0u8; 1024];
            let (amt, src) = udp_socket.recv_from(&mut buf).expect("recv_from failed");
            let buf = &mut buf[..amt];
            let text = String::from_utf8(buf.to_vec()).unwrap();
            println!("get message {:?}", text);
            let port = state.config.lock().unwrap().clone().unwrap().port;
            println!("port {:?}", port);
            println!("addr:{:?}", src);
            // let payload: MessagePayload =
            //     serde_json::from_str(&String::from(text.clone().unwrap())).unwrap();
            let res = window.emit("paste", text.clone());
        
            // buf.reverse();
            sleep(time::Duration::from_secs(1));
            // udp_socket.send_to(buf, &src).expect("send_to failed");
        }
    });
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let setting = CustomMenuItem::new("setting".to_string(), "Setting");

    let tray_menu = SystemTrayMenu::new()
        .add_item(quit)
        .add_item(setting)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide);
    let tray = SystemTray::new().with_menu(tray_menu);

    // let socket = UdpSocket::bind("127.0.0.1:9000").expect("bind failed");
    // let socket = UdpSocket::bind("0.0.0.0:8000").expect("bind failed");

    let socket = UdpSocket::bind("0.0.0.0:7000").expect("bind failed");
    socket.set_broadcast(true);
    let socketData = Arc::new(Mutex::new(socket));
    // let read_data = Arc::clone(&socketData);

    tauri::Builder::default()
        .manage(ClipboardState {
            // connection: socketData,
            connection: Arc::new(Mutex::new(None)),
        })
        .manage(AppState {
            client_id: Arc::new(Mutex::new(String::from(""))),
            config: Mutex::new(None),
        })
        .system_tray(tray)
        .on_system_tray_event(|app: &AppHandle, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a left click");
            }
            SystemTrayEvent::RightClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a right click");
            }
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a double click");
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                "setting" => {
                    println!("setting");
                    // tauri::WindowBuilder::new(
                    //     app,
                    //     "dashboard",
                    //     tauri::WindowUrl::App("index.html".into()),
                    // );
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            send_clipboard_event,
            set_client_id,
            greet,
            commands::update_config
        ])
        .plugin(tauri_plugin_clipboard::init())
        .setup(|app: &mut App| {

            
            println!("app setup");
            let handle = app.handle();
            // handle.tray_handle().set_icon(icon)
            let state = handle.state::<ClipboardState>();
            let app_state = handle.state::<AppState>();
            println!("config:{:?}", app_state.config.lock().unwrap());

            // let socket = UdpSocket::bind("0.0.0.0:8000").expect("bind failed");
            // socket.set_broadcast(true);
            // *state.connection.lock().unwrap() = Some(socket);
            // let socketData = Arc::new(Mutex::new(socket));
            // state.connection = socketData;

            let arc_app = Arc::new(Mutex::new(app));
            // let app1 = Arc::clone(&arc_app);
            // let udp_socket = state
            //     .connection
            //     .clone()
            //     .lock()
            //     .unwrap()
            //     .as_ref()
            //     .unwrap()
            //     .try_clone()
            //     .unwrap();
            // listen_connection(udp_socket, app1);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
