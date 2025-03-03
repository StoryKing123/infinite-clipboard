import { Button, Image, Listbox, ListboxItem } from '@heroui/react';
import type { Selection } from '@heroui/react';
import { useAtom } from 'jotai';
import {
  baseClipboardAtom,
  clipboardStore,
  deleteClipboard,
} from '../../store';
import Database from '@tauri-apps/plugin-sql';
import { throttle } from 'es-toolkit';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

interface ClipboardListProps {
  db: Database | undefined;
}

const ClipboardList = ({ db }: ClipboardListProps) => {
  const [clipboard, setClipboard] = useAtom(clipboardStore);
  const [selectedKeys, setSelectedKeys] = useState(new Set<string>([]));
  const [, deleteClip] = useAtom(deleteClipboard);

  const containerRef = useRef<HTMLDivElement>(null);
  const [listboxHeight, setListboxHeight] = useState(400); // 初始值设为400

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const newHeight = containerRef.current.clientHeight;
        setListboxHeight(newHeight); // 更新高度状态
        console.log('窗口改变，新高度:', newHeight);
      }
    };

    // 立即获取初始高度
    handleResize();

    const throttleHandleResize = throttle(handleResize, 1000);

    // 监听窗口 resize 事件
    window.addEventListener('resize', throttleHandleResize);

    return () => {
      window.removeEventListener('resize', throttleHandleResize);
    };
  }, []);

  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(', '),
    [selectedKeys]
  );
  const deferredClipboard = useDeferredValue(clipboard);

  const handleClearAllHistory = async () => {
    // await db?.execute('DELETE FROM clipboard');
    // setClipboard([]);
    deleteClip([])
  };

  const handleClearHistory = async () => {
    // await db?.execute('DELETE FROM clipboard WHERE id = ?', [selectedKeys]);
    // setClipboard(
    //   clipboard.filter(item => !selectedKeys.has(item.id.toString()))
    // );
    deleteClip([...selectedKeys]);
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
      <div ref={containerRef} className="flex-1 mt-2">
        <Listbox
          //  disallowEmptySelection
          // aria-label="Multiple selection example"
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          variant="flat"
          onSelectionChange={handleSelectionChange}
          isVirtualized
          virtualization={{
            maxListboxHeight: listboxHeight,
            // maxListboxHeight: 651,
            itemHeight: 40,
          }}
        >
          {deferredClipboard.map((item, index) => (
            <ListboxItem
              id={item.id.toString()}
              data-index={index}
              onPress={async e => {}}
              key={item.id}
              textValue={item.id}
              className="truncate"
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
