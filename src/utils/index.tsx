import { invoke } from "@tauri-apps/api";

/**
 * 生成一个用不重复的ID
 * @param { Number } randomLength
 */
export function getUuiD(randomLength: number) {
    return Number(
        Math.random()
            .toString()
            .substring(2, 2 + randomLength) + Date.now()
    ).toString(36);
}

export const setAppConfig = (config: Config) => {
    console.log('update config')
    invoke("update_config", {
        configStr: JSON.stringify(config),
    });
};

export const setClientId = (clientId: string) => {
    invoke("set_client_id", {
        id: window.clientId,
    });
};

const setClipboard = () => {};

const getClipboard = () => {};

export const initDB = () => {
    let request = window.indexedDB.open("clpboard", 1);
    let db;
    request.onerror = function (event) {
        console.log("数据库打开报错");
    };
    request.onsuccess = function (event) {
        db = request.result;
        console.log("数据库打开成功");
    };

    request.onupgradeneeded = function (event) {
        db = (event.target! as any).result;
        // var objectStore = db.createObjectStore("person", { keyPath: "id" });
        // };
        if (!db!.objectStoreNames.contains("clipboard")) {
            let objectStore = db.createObjectStore("clipboard", {
                keyPath: "id",
            });
        }
    };
};
