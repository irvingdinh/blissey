import { useCallback, useState } from "react";

export function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );

  return { message, show } as const;
}
