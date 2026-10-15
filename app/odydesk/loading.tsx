// While Next.js opens an OdyDesk page: black screen + spinning Odysra logo (never white).
import { LOADER_CSS, OdyLoaderScreen } from "@/components/OdyLoaderScreen";

export default function Loading() {
  return (
    <>
      <style>{LOADER_CSS}</style>
      <OdyLoaderScreen phase="cover" />
    </>
  );
}
