import { Button, Image, Listbox, ListboxItem } from '@heroui/react';
import type { Selection } from '@heroui/react';
import { useAtom } from 'jotai';
import { baseClipboardAtom, clipboardStore } from '../../store';
import Database from '@tauri-apps/plugin-sql';
import { useMemo, useState } from 'react';

interface ClipboardListProps {
  db: Database | undefined;
}

const ClipboardList = ({ db }: ClipboardListProps) => {
  const [clipboard, setClipboard] = useAtom(clipboardStore);
  const [selectedKeys, setSelectedKeys] = useState(new Set<string>([]));

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(', '),
    [selectedKeys]
  );

 

  const handleClearAllHistory = async () => {
    // await db?.execute('DELETE FROM clipboard');
    setClipboard([]);
  };

  const handleClearHistory = async () => {
    await db?.execute('DELETE FROM clipboard WHERE id = ?', [selectedKeys]);
    setClipboard(
      clipboard.filter(item => !selectedKeys.has(item.id.toString()))
    );
  };

  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys as any);
    // setSelectedKeys(new Set(Array.from(keys.toString())));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2">
        <Button
          size="sm"
          isDisabled={selectedKeys.size === 0}
          className="ml-auto"
          onPress={handleClearHistory}
        >
          清除
        </Button>
        <Button
          onPress={handleClearAllHistory}
          color="danger"
          size="sm"
          className=" mr-0"
        >
          清除全部
        </Button>
      </div>
      <div className="flex-1 overflow-y-scroll mt-2">
        {/* <Listbox
          aria-label="Multiple selection example"
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          variant="flat"
          onSelectionChange={(e)=>{
            console.log(e)
          }}
        >
          <ListboxItem key="text">Text</ListboxItem>
          <ListboxItem key="number">Number</ListboxItem>
          <ListboxItem key="date">Date</ListboxItem>
          <ListboxItem key="single_date">Single Date</ListboxItem>
          <ListboxItem key="iteration">Iteration</ListboxItem>
        </Listbox> */}
        <Listbox
          //  disallowEmptySelection
          aria-label="Multiple selection example"
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          variant="flat"
          onSelectionChange={handleSelectionChange}
        >
          {clipboard.map((item, index) => (
            <ListboxItem
              id={item.id.toString()}
              data-index={index}
              onPress={async e => {}}
              key={item.id}
              textValue={item.id}
              // children={<div>123</div>}
            >
              {item.type === 0 && item.content}
              {item.type === 1 && (
                <Image
                  width={100}
                  src={`data:image/png;base64,${item.content}`}
                ></Image>
              )}
            </ListboxItem>
          ))}
        </Listbox>
        {/* {clipboard.map((item) => (
          <div key={item.id} className="p-2 border-b">
            {item.content}
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default ClipboardList;
