import { useActions } from '../hooks/useActions';

export function SomeComponent() {
  const { performAction, pendingActions, isSyncing } = useActions();

  const handleLike = async () => {
    await performAction({
      type: 'like',
      data: {
        userId: currentUserId,
        targetId: itemId,
        timestamp: new Date().toISOString()
      }
    }, 'like');
  };

  return (
    <div>
      <button onClick={handleLike}>
        Лайк {pendingActions.length > 0 && '(Ожидает синхронизации)'}
      </button>
      {isSyncing && <span>Синхронизация...</span>}
    </div>
  );
} 