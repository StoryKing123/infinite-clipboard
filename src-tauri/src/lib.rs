mod commands;

use base64::{prelude::BASE64_STANDARD, Engine};
use rand_core::OsRng;
use serde::Serialize;
use serde_json::{json, to_string};
use tauri::{
    http::{self, Response},
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, AppHandle, Emitter, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
};

#[cfg(target_os = "macos")]
use tauri_nspanel::{
    cocoa::appkit::NSWindowCollectionBehavior, panel_delegate, ManagerExt, WebviewWindowExt,
};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_sql::{Migration, MigrationKind};
use x25519_dalek::{EphemeralSecret, PublicKey, SharedSecret, StaticSecret};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(target_os = "macos")]
fn init(app_handle: &AppHandle) {
    let window: WebviewWindow = app_handle.get_webview_window("mini-clipboard").unwrap();

    let panel = window.to_panel().unwrap();

    let delegate = panel_delegate!(MyPanelDelegate {
        window_did_become_key,
        window_did_resign_key
    });

    let handle = app_handle.to_owned();

    delegate.set_listener(Box::new(move |delegate_name: String| {
        match delegate_name.as_str() {
            "window_did_become_key" => {
                let app_name = handle.package_info().name.to_owned();

                println!("[info]: {:?} panel becomes key window!", app_name);
            }
            "window_did_resign_key" => {
                println!("[info]: panel resigned from key window!");
            }
            _ => (),
        }
    }));

    // Set the window to float level
    #[allow(non_upper_case_globals)]
    const NSFloatWindowLevel: i32 = 4;
    panel.set_level(NSFloatWindowLevel);

    #[allow(non_upper_case_globals)]
    const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;
    // Ensures the panel cannot activate the app
    panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);

    // Allows the panel to:
    // - display on the same space as the full screen window
    // - join all spaces
    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces,
    );

    panel.set_delegate(delegate);
}

#[tauri::command]
fn exit_app(handle: AppHandle) {
    handle.exit(1);
}

#[tauri::command]
fn show_panel(handle: AppHandle) {
    if cfg!(target_os = "macos") {
        #[cfg(target_os = "macos")]
        {
            let panel = handle.get_webview_panel("mini-clipboard").unwrap();
            panel.show();
        }
    } else {
        let window = handle.get_webview_window("mini-clipboard").unwrap();
        window.show();
    }
}

#[tauri::command]
fn hide_panel(handle: AppHandle) {
    if cfg!(target_os = "macos") {
        #[cfg(target_os = "macos")]
        {
            let panel = handle.get_webview_panel("mini-clipboard").unwrap();
            panel.order_out(None);
        }
    }
}

#[tauri::command]
fn close_panel(handle: AppHandle) {
    if cfg!(target_os = "macos") {
        #[cfg(target_os = "macos")]
        {
            let panel = handle.get_webview_panel("mini-clipboard").unwrap();

            panel.set_released_when_closed(true);

            panel.close();
            // let panel = handle.get_webview_panel("mini-clipboard").unwrap();
            // panel.order_out(None);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 2,
            description: "create_initial_tables",
            sql: include_str!("../migrations/app.sql"),
            kind: MigrationKind::Up,
        },
    ];

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let mini_window = tauri::WebviewWindowBuilder::new(
                app,
                "mini-clipboard",                           // 窗口标签
                tauri::WebviewUrl::App("clipboard".into()), // URL 路径
            )
            .title("Mini Clipboard")
            .inner_size(300.0, 600.0)
            .center()
            .devtools(true)
            .decorations(false)
            .always_on_top(true)
            .transparent(true)
            .build()?;

            // 初始时隐藏窗口
            mini_window.hide()?;

            // #[cfg(target_os = "macos")]
            if cfg!(target_os = "macos") {
                #[cfg(target_os = "macos")]
                init(app.app_handle());
            }
            //   mini_window.to_panel();

            Ok(())
        })
        .register_uri_scheme_protocol("infiniteclipboard", |app, req| {
            println!("call protocol event");

            // 获取请求的 URL
            let url = req.uri().to_string();
            // Parse the URL to extract query parameters
            if let Ok(parsed_url) = Url::parse(&url) {
                let params: std::collections::HashMap<_, _> =
                    parsed_url.query_pairs().into_owned().collect();

                if let (Some(token), Some(email)) = (params.get("token"), params.get("email")) {
                    tauri::async_runtime::block_on(async {
                        // 获取主窗口和 OAuth 窗口
                        // app.app_handle().get_webview_window(label)
                        if let Some(main_window) = app.app_handle().get_webview_window("main") {
                            if let Some(oauth_window) =
                                app.app_handle().get_webview_window("github-oauth")
                            {
                                // 发送 URL 参数到主窗口
                                main_window
                                    .emit(
                                        "oauth-callback",
                                        json!({
                                            "token":token,
                                            "email":email
                                        }),
                                    )
                                    .unwrap();
                                // 关闭 OAuth 窗口
                                oauth_window.close().unwrap();
                            }
                        }
                    });
                }
            }
            // let body = req.body().unwrap();
            // println!("body: {}", body);

            // 在主线程中执行窗口操作

            http::Response::builder()
                .header("Access-Control-Allow-Origin", "*")
                .body("hello".as_bytes().to_vec())
                .unwrap()
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                // .add_migrations("sqlite:app.db", migrations)
                .build(),
        )
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("log.txt".to_string()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        );

    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_nspanel::init());
    }
    builder
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::send::sendText,
            show_panel,
            hide_panel,
            close_panel,
            exit_app,
            commands::send::paste,
            commands::encrypt::generate_x25519_key_secret,
            commands::encrypt::calc_shared_secret
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Serialize, Clone, Debug)]
struct KeySecretBytes {
    secret_bytes: [u8; 32],
    key_bytes: [u8; 32],
}
