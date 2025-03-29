import * as ContextMenu from '@radix-ui/react-context-menu';

type PartContextMenuProps = {
  // 移動順序を変更するコールバック
  onMoveOrder: ({
    partId,
    type,
  }: {
    partId: number;
    type: 'back' | 'backmost' | 'front' | 'frontmost';
  }) => void;
  // パーツID
  partId: number;
};

/**
 * パーツのコンテキストメニュー
 */
const PartContextMenu = ({ onMoveOrder, partId }: PartContextMenuProps) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="w-full h-full" asChild>
        <div className="w-full h-full" />
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[80px] bg-[#1f1f1f] rounded-md p-1 shadow-lg border">
          <ContextMenu.Item
            className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
            onClick={() => onMoveOrder({ partId, type: 'back' })}
          >
            背面へ移動
          </ContextMenu.Item>
          <ContextMenu.Item
            className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
            onClick={() => onMoveOrder({ partId, type: 'backmost' })}
          >
            最背面へ移動
          </ContextMenu.Item>
          <ContextMenu.Item
            className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
            onClick={() => onMoveOrder({ partId, type: 'front' })}
          >
            前面へ移動
          </ContextMenu.Item>
          <ContextMenu.Item
            className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
            onClick={() => onMoveOrder({ partId, type: 'frontmost' })}
          >
            最前面へ移動
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

export default PartContextMenu;
