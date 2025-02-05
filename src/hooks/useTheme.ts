import { useAtom } from "jotai";
import { useEffect } from "react";
import { settingStore } from "../store";


export const useTheme = () => {
    const [setting] = useAtom(settingStore);

    
    useEffect(() => {
        console.log('theme change')
        console.log(setting.theme)
        // debugger
        if (setting.theme === "dark") {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
        }
    }, [setting.theme]);
};
