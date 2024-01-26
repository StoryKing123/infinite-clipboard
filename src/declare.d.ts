
interface Window {
    clientId: string
}

type Config = {
    connectType: "UDP" | "HTTP",
    port: number
    quicPort:number
    ipAddress: string[]
}





type Unsubscribe = () => void;
interface AsyncStorage<Value> {
    getItem: (key: string, initialValue: Value) => PromiseLike<Value>;
    setItem: (key: string, newValue: Value) => PromiseLike<void>;
    removeItem: (key: string) => PromiseLike<void>;
    subscribe?: (key: string, callback: (value: Value) => void, initialValue: Value) => Unsubscribe;
}