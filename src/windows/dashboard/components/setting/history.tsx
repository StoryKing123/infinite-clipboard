import { FC } from "react";
import { useAtom } from "jotai";
import { List } from "@arco-design/web-react";
import { clipboardStorageStore } from "../../store";

const History: FC = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStorageStore);

    return (
        <div>
            <List
                // style={{ width: 622 }}
                size="small"
                header="复制记录"
                dataSource={clipboard}
                render={(item, index) => (
                    <List.Item style={{ textAlign: "left" }} key={index}>
                        {item.value}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default History;
