import { atomWithStorage } from 'jotai/utils'
import localforage from "localforage";

const loadClipboard = async () => {
    let clipboard = await localforage.getItem<ClipboardType>("clipboard");
    // let config: Config | null;
    if (!clipboard) {
        clipboard = initClipboard();
        // setConfig(config);
    }
    // config = JSON.parse(configString!);
    return clipboard;
};

const initClipboard = () => {
    const newConfig: ClipboardType = []
    return newConfig;
};
// export const configAtom = atom(loadConfig);



const localForageStore: AsyncStorage<ClipboardType> = {
    async setItem(key: string, value: ClipboardType) {
        await localforage.setItem(key, value);
    },
    async getItem(key: string, initialValue: ClipboardType) {
        const result = await localforage.getItem<ClipboardType>(key);
        if (result) return result
        
        return []

    },

    async removeItem(key: string) {
        await localforage.removeItem(key);

    }
}

// export const clipboardStorageStore = atomWithStorage<ClipboardType>('clipboard', await loadClipboard(), localForageStore)
export const clipboardStorageStore = atomWithStorage<ClipboardType>('clipboard', null, localForageStore)