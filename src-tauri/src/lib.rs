use tauri::{http::{self, Response}, Listener, Manager};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn login() {
    
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .setup(|app|{
        let main_window = app.get_webview_window("main").unwrap();

        app.listen("tauri://app/callback", move |event| {

            // if let String::from(url) = event.payload() {
            //     let url_result = Url::parse(&url);
            //     if let Ok(parsed_url) = url_result {
            //         let query_params = parsed_url.query_pairs();

            //          for (key, value) in query_params {
            //             if key == "code" {
            //                 println!("OAuth Code: {}", value);
            //                 // 在这里处理你的 code，例如发送到前端
            //                 main_window.emit("github-oauth-code", value).unwrap();
            //             }
            //         }
                 
            //     } else {
            //         eprintln!("Failed to parse URL: {}", url);
            //     }
            // }
            // eprintln!("get event", );
        });
        Ok(())
    }).register_uri_scheme_protocol("infiniteclipboard", |_app, req| {
        println!("call protocol event");
        http::Response::builder()
        .header("Access-Control-Allow-Origin", "*")

        .body("hello".as_bytes().to_vec())
        .unwrap()
        // Response::new("hello world")
        // tauri::http::Response::new()
        // .header("Origin", "*")
        // .mimetype("image/svg+xml")
        // .header("Content-Length", buf.len())
        // .status(200)
        // .body(String::from("ok"))
        // Ok(())
    })
     .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
