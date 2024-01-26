// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use core::time;
use std::{
    error::Error,
    io::{Read, Write},
    net::{TcpListener, TcpStream, UdpSocket},
    sync::Arc,
    thread::{self, sleep},
};
pub mod commands;
pub mod udp;

use commands::{FilePendingItem, UDPAction};
use s2n_quic::{Client, Server};
// use event::update_config;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{
    async_runtime::handle, utils::config::parse::parse_json, App, AppHandle, Context,
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_clipboard;
use tokio::sync::Mutex;
use udp::{self as other_udp, build_quic_server_and_client};

#[derive(Debug, Clone)]
pub struct ClipboardState {
    connection: Arc<Mutex<Option<UdpSocket>>>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]

pub struct Config {
    port: Option<i16>,
    ip_address: Option<Vec<String>>,
}
pub struct AppState {
    client_id: Arc<Mutex<String>>,
    config: Mutex<Option<Config>>,
    quic_server: Arc<Mutex<Option<Server>>>,
    quic_client: Arc<Mutex<Option<Client>>>,
    file_pending_queue: Arc<Mutex<Vec<FilePendingItem>>>,
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
struct UDPRequest {
    value: Option<String>,
    client_id: String,
    id: String,
    action: UDPAction,
    message_type: u8,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MessagePayloadInit {
    client_id: String,
    id: String,
    message_type: u8,
}

#[tauri::command]
async fn set_client_id(id: &str, state: tauri::State<'_,AppState>) -> Result<(), ()> {
    let mut client_id = state.client_id.lock().await;
    println!("set client id:{:?}", id);
    *client_id = String::from(id);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
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
    // let (server, client) = build_quic_server_and_client().unwrap();

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
            quic_client: Arc::new(Mutex::new(None)),
            quic_server: Arc::new(Mutex::new(None)),
            file_pending_queue: Arc::new(Mutex::new(vec![])),
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
            commands::send_clipboard_event,
            set_client_id,
            greet,
            commands::update_config,
            commands::send_clipboard_image_event
        ])
        .plugin(tauri_plugin_clipboard::init())
        .setup(|app: &mut App| {
            println!("app setup");
            let handle = app.handle();
            // handle.tray_handle().set_icon(icon)
            // let state = handle.state::<ClipboardState>();
            let app_state = handle.state::<AppState>();
            // println!("config:{:?}", app_state.config.lock().await);

            // let arc_app = Arc::new(Mutex::new(app));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    Ok(())
}
