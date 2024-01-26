
export const VERSION = "0.0.3"



export enum CLIPBOARD_TYPE {
    TEXT = 0,
    IMAGE = 1,
    FILE = 2
}

export enum CLIPBOARD_SOURCE_TYPE {
    LOCAL = 0,
    EXTERNAL = 1
}

export type ClipboardSingleItem = {
    value: string
    type: CLIPBOARD_TYPE
    created: number
    sourceType: CLIPBOARD_SOURCE_TYPE
    source: string
}

export type ClipboardType = ClipboardSingleItem[]
