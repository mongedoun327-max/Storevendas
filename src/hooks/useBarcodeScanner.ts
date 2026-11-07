import { useEffect, useRef } from "react";

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  timeThreshold?: number;
  minLength?: number;
  ignoreInputs?: boolean;
}

export function useBarcodeScanner({
  onScan,
  timeThreshold = 35,
  minLength = 3,
  ignoreInputs = true,
}: BarcodeScannerOptions) {
  const onScanRef = useRef(onScan);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = target
        && (target.tagName === "INPUT"
          || target.tagName === "TEXTAREA"
          || target.isContentEditable);

      if (ignoreInputs && isEditable) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (timeDiff > timeThreshold && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (event.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          event.preventDefault();
          onScanRef.current(bufferRef.current);
        }
        bufferRef.current = "";
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timeThreshold, minLength, ignoreInputs]);
}
