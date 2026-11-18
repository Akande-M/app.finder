import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { compressImage } from "./image";

/**
 * Two hidden file inputs: one opens the rear camera on phones (capture="environment"),
 * the other opens the photo library. Desktop browsers show a file picker for both.
 */
export function usePhotoPicker() {
  const navigate = useNavigate();
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImage(file);
      navigate("/scan", { state: { image } });
    } finally {
      setBusy(false);
    }
  }

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={library} type="file" accept="image/*" hidden onChange={onFile} />
    </>
  );

  return {
    inputs,
    busy,
    openCamera: () => camera.current?.click(),
    openLibrary: () => library.current?.click(),
  };
}
