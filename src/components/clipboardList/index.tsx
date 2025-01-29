import { Button } from "@heroui/react";
import { useAtom } from "jotai";
import { clipboardStore } from "../../store";
import Database from "@tauri-apps/plugin-sql";

interface ClipboardListProps {
  db: Database | undefined;
}

const ClipboardList = ({ db }: ClipboardListProps) => {
  const [clipboard, setClipboard] = useAtom(clipboardStore);

  const handleClearHistory = async () => {
    await db?.execute("DELETE FROM clipboard");
    setClipboard([]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex">
        <Button
          onPress={handleClearHistory}
          color="danger"
          size="sm"
          className="ml-auto mr-0"
        >
          清除全部
        </Button>
      </div>
      <div className="flex-1 overflow-y-scroll mt-2">
        {clipboard.map((item) => (
          <div key={item.id} className="p-2 border-b">
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClipboardList;
