import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { rewardsApi } from '../api/rewardsApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Subscribes to the SSE notification stream for the current player.
 * When a new notification is pushed, invalidates the notifications cache
 * so the badge and list refetch.
 */
export function useNotificationStream(playerId: string | null) {
  const dispatch = useDispatch();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${API_URL}/api/v1/player/notifications/stream`;
    fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Player-Id': playerId,
        Accept: 'text/event-stream',
      },
    })
      .then((res) => {
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const read = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  JSON.parse(line.slice(6));
                  dispatch(rewardsApi.util.invalidateTags(['Notifications']));
                } catch {
                  // ignore parse errors
                }
              }
            }
            return read();
          });
        return read();
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.warn('Notification stream error:', err);
        }
      });

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [playerId, dispatch]);
}
