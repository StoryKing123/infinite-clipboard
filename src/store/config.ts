
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import localforage from "localforage";

const loadConfig = async () => {
    let config = await localforage.getItem<Config>("config");
    // let config: Config | null;
    if (!config) {
        config = initConfig();
        // setConfig(config);
    }
    // config = JSON.parse(configString!);
    return config;
};

const setConfig = (config: Config) => {
    localStorage.setItem("config", JSON.stringify(config));
};
const initConfig = () => {
    const newConfig: Config = {
        connectType: "UDP",
        port: 9000,
        ipAddress: ['255.255.255.255:8000'],
    };
    return newConfig;
};
// export const configAtom = atom(loadConfig);




const localForageStore: AsyncStorage<Config> = {
    async setItem(key: string, value: Config) {
        await localforage.setItem(key, value);
    },
    async getItem(key: string, initialValue: Config) {
        const result = await localforage.getItem<Config>(key);
        if (result) return result

        let initVal = initConfig()
        return initVal

    },

    async removeItem(key: string) {
        await localforage.removeItem(key);

    }
}

export const configStorageStore = atomWithStorage<Config>('config', null, localForageStore
)