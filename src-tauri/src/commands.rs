use std::{
    net::{SocketAddr, UdpSocket},
    ops::Deref,
    process::id,
    str::FromStr,
    sync::Arc,
    thread,
    time::{SystemTime, UNIX_EPOCH},
};

use app_udp::UDPBatchMessage;
use s2n_quic::client::Connect;
use serde::{Deserialize, Serialize};
use serde_json::{json, Error};
use tauri::{App, AppHandle, Manager};

use crate::{
    json_bytes,
    udp::{self as app_udp, build_quic_server_and_client},
    AppState, ClipboardState, Config, UDPRequest,
};

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FilePendingItem {
    id: String,
    created_on: u128,
    value: String,
    ip_addr: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum UDPAction {
    SyncText,
    SyncImage,
    SyncFile,
    SyncImageResponse,
    SendImageByQuic,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUdpRes {
    id: String,
    sync: bool,
}

#[tauri::command]
pub async fn update_config(
    config_str: &str,
    state: tauri::State<'_, AppState>,
    clip_state: tauri::State<'_, ClipboardState>,
    app: tauri::AppHandle,
) -> Result<(), ()> {
    println!("update config");
    println!("{:?}", config_str);
    let config: Config = serde_json::from_str(config_str).unwrap();
    println!("{:?}", config);

    *state.config.lock().await = Some(config.clone());

    let mut arc_connection = Arc::clone(&clip_state.connection);
    {
        let mut connection = arc_connection.lock().await;

        let bind_address =
            SocketAddr::from_str(format!("0.0.0.0:{:?}", config.port.unwrap()).as_str()).unwrap();
        if connection.is_some() {
            let address = connection.as_ref().unwrap().local_addr().unwrap();
            // let prev_address = SocketAddr::from_str(config.port.unwrap());
            if address.eq(&bind_address) {
                return Ok(());
            }
        }

        let socket = UdpSocket::bind(bind_address).expect("bind failed");

        socket.set_broadcast(true);
        *connection = None;
        *connection = Some(socket);
    }

    {
        if config.quic_port.is_some() {
            let (serever, client) =
                build_quic_server_and_client(config.quic_port.unwrap()).unwrap();
            let mut quic_client = state.quic_client.lock().await;
            *quic_client = Some(client);

            let mut quic_server = state.quic_server.lock().await;
            *quic_server = Some(serever);
        }
    }
    println!("start listen");
    listen_connection(app.clone()).await;
    listen_quic_connection(app.clone()).await;
    // println!("4444");
    // println!("2");

    Ok(())
}

// fn listen_connection(app: Arc<Mutex<AppHandle>>) {
async fn listen_connection(app: AppHandle) {
    let app_context = app;
    let clip_state = app_context.state::<ClipboardState>();
    let window = app_context.get_window("main").unwrap();
    let handle = app_context.app_handle();
    // let c = Arc::clone(&clip_state.connection);
    let mut udp_socket = clip_state.connection.lock().await;
    let mut udp_socket = udp_socket.as_mut().unwrap();
    let udp_socket = udp_socket.try_clone().unwrap();
    let app_copy = app_context.clone();
    // udp_socket.set_broadcast(true);

    // thread::spawn(move || async move {
    tokio::spawn(async move {
        // let clipboard = handle.state::<tauri_plugin_clipboard::ClipboardManager>();
        let state = handle.clone().state::<AppState>().clone();
        loop {
            let mut buf = [0u8; 1024];
            println!("start receive message ....");
            let (amt, src) = udp_socket.recv_from(&mut buf).expect("recv_from failed");
            let buf = &mut buf[..amt];
            handle_udp_message(buf, src, app_copy.clone()).await;
        }
    });
}

async fn handle_udp_message(buf: &[u8], src: SocketAddr, app: AppHandle) {
    // return ();
    let clip_state = app.state::<ClipboardState>();
    // let window = app_context.get_window("main").unwrap();
    let app_state = app.state::<AppState>();
    // let handle = app.app_handle();
    // let c = Arc::clone(&clip_state.connection);
    let mut udp_socket = clip_state.connection.lock().await;

    let udp_socket = udp_socket.as_mut().unwrap();

    let text = String::from_utf8(buf.to_vec()).unwrap();
    let payload: UDPRequest = serde_json::from_str(&String::from(text.clone())).unwrap();
    println!("receive message! payload:{:?}", payload);
    let config = app_state.config.lock().await.clone().unwrap();
    let window = app.get_window("main").unwrap();
    match payload.action {
        UDPAction::SyncText => {
            let res = window.emit("paste", text.clone());
        }
        UDPAction::SyncImage => {
            println!("get image");
            let payload = json!(UDPRequest {
                value: Some(config.quic_port.unwrap().to_string()),
                client_id: payload.client_id,
                id: payload.id,
                action: UDPAction::SyncImageResponse,
                message_type: 1
            });
            let respons = json_bytes(payload.clone());
            println!("send response to {:?},payload:{:?}", &src, payload.clone());
            let res = udp_socket.send_to(&respons, &src).unwrap();
            println!("{:?}", res);
        }
        UDPAction::SyncImageResponse => {
            //send base64 image
            let mut quic_client = app_state.quic_client.lock().await;
            let ip = src.ip();
            let port = payload.value.unwrap().parse::<i16>().unwrap();

            let addr: SocketAddr =
                SocketAddr::from_str(format!("{:?}:{:?}", ip, port).as_str()).unwrap();
            let connect = Connect::new(addr).with_server_name("localhost");

            println!(
                "establish quic address:{:?}",
                format!("{:?}:{:?}", ip, port)
            );
            let client_id = app_state.client_id.lock().await;
            if addr
                .ip()
                .eq(&SocketAddr::from_str("192.168.5.4:8001").unwrap().ip())
            {
                println!("skip");
                return ();
            }
            // if *client_id == payload.client_id {
            //     return ();
            // }

            let mut connection = quic_client
                .as_mut()
                .unwrap()
                .connect(connect)
                .await
                .unwrap();

            connection.keep_alive(true);
            let stream = connection.open_bidirectional_stream().await.unwrap();
            let (mut receive_stream, mut send_stream) = stream.split();
            // let mut reader: &[u8] = b"hello";
            let queue = app_state.file_pending_queue.lock().await;
            let image = queue.iter().find(|item| item.id == payload.id).unwrap();

            let message = UDPRequest {
                value: Some(image.value.to_string()),
                client_id: payload.client_id,
                id: payload.id,
                action: UDPAction::SendImageByQuic,
                message_type: 2,
            };
            let bytes = json_bytes(json!(message));

            // tokio::spawn(async move {
            println!("send quic request start");
            tokio::io::copy(&mut bytes.as_slice(), &mut send_stream)
                .await
                .unwrap();
            println!("sendd quic requestt finished")
            // });
        }
        UDPAction::SendImageByQuic => {
            //receive base64 image
            window.emit("pasteImage", text.clone());
        }
        UDPAction::SyncFile => {}
        _ => todo!(),
    }
}

async fn listen_quic_connection(app: AppHandle) {
    let state = app.state::<AppState>();
    let mut server = &state.quic_server;
    println!(
        "start listen quic connection:{:?}",
        server.lock().await.as_mut().unwrap().local_addr()
    );

    let mut s = Arc::clone(server);
    // let mut server = server.as_mut().unwrap();
    // let server = serv23
    tokio::spawn(async move {
        // let state = state.clone();
        let mut s = s.lock().await;
        let mut s = s.as_mut().unwrap();
        while let Some(mut connection) = s.accept().await {
            println!("accept quic data");

            while let Ok(Some(mut event)) = connection.accept().await {
                tokio::spawn(async move {
                    while let Ok(Some(data)) = event.receive().await {
                        let data = data;
                        println!("receive quic data");
                        println!("data{:?}", String::from_utf8(data.to_vec()));
                        event.send_data("ok".into());
                    }

                    ()
                });
            }
        }
        ()
    });
}

#[tauri::command]
pub async fn send_clipboard_event(
    value: &str,
    id: &str,
    state: tauri::State<'_, ClipboardState>,
    app_state: tauri::State<'_, AppState>,
) -> Result<(), ()> {
    // println!("{:?}", value);
    println!("start send");

    let connection = state.connection.clone();
    let binding = connection.lock().await;
    let socket = binding;

    let message_payload = UDPRequest {
        id: String::from(id),
        value: Some(value.to_string()),
        client_id: app_state.client_id.lock().await.to_string(),
        action: UDPAction::SyncText,
        message_type: 0,
    };

    let json_body = json!(message_payload);
    println!("{:?}", json_body);
    let bytes = json_bytes(json_body);
    println!("{:?}", bytes);

    let address = app_state
        .config
        .lock()
        .await
        .clone()
        .unwrap()
        .ip_address
        .unwrap();

    for ip in address {
        println!("{:?}", &ip);
        // let res = socket.send_to(&bytes, "255.255.255.255:8000");
        let res = socket.as_ref().unwrap().send_to(&bytes, ip);
        // socket.as_ref().unwrap().send
        // let soc = UdpSocket::bind("0.0.0.0:1234").unwrap();
        // soc.sen
        println!("{:?}", res);
    }
    // let res = socket.send_to(value.as_bytes(), "255.255.255.255:8000");
    // connection.write(value.as_bytes()).unwrap();
    println!("send event");
    Ok(())
}

#[tauri::command]
pub async fn send_clipboard_image_event(
    value: &str,
    id: &str,
    state: tauri::State<'_, ClipboardState>,
    app_state: tauri::State<'_, AppState>,
) -> Result<(), ()> {
    // println!("{:?}", value);
    println!("start  send image");

    // return();

    let connection = state.connection.clone();
    let binding = connection.lock().await;
    let socket = binding;

    let message_payload = UDPRequest {
        id: String::from(id),
        value: None,
        action: UDPAction::SyncImage,
        client_id: app_state.client_id.lock().await.to_string(),
        message_type: 1,
    };

    let json_body = json!(message_payload);
    let bytes = json_bytes(json_body);
    let address = app_state
        .config
        .lock()
        .await
        .clone()
        .unwrap()
        .ip_address
        .unwrap();

    // 获取当前时间
    let current_time = SystemTime::now();

    // 获取 UNIX 时间戳（距离 UNIX 纪元的秒数）
    let timestamp = current_time
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    // 打印结果
    let current_timestamp = timestamp.as_millis();

    let mut queue = app_state.file_pending_queue.lock().await;
    queue.push(FilePendingItem {
        id: String::from(id),
        created_on: current_timestamp,
        value: value.to_string(),
        ip_addr: [].to_vec(),
    });

    for ip in address {
        println!("{:?}", &ip);
        // let res = socket.send_to(&bytes, "255.255.255.255:8000");
        // let res = socket.as_ref().unwrap().send_to(&bytes, ip);
        println!("{:?}", &bytes.len());
        let res = socket.as_ref().unwrap().send_to(&bytes, ip);

        println!("{:?}", res);
    }
    // let res = socket.send_to(value.as_bytes(), "255.255.255.255:8000");
    // connection.write(value.as_bytes()).unwrap();
    println!("send event");
    Ok(())
}
