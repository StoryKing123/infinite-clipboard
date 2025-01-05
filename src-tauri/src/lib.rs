use serde_json::{json, to_string};
use tauri::{
    http::{self, Response},
    Emitter, Listener, Manager, Url,
};
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn login() {}

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

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| Ok(()))
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
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
