import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export interface EditorWrapperProps {
  initialData?: OutputData;
  attachableType?: string;
  attachableId?: string;
  onChange?: (data: OutputData) => void;
  fullscreen?: boolean;
  toolbar?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
  };
}

export interface EditorWrapperHandle {
  getData: () => Promise<OutputData>;
  setData: (data: OutputData) => Promise<void>;
}

const EditorWrapper = forwardRef<EditorWrapperHandle, EditorWrapperProps>(
  function EditorWrapper(
    {
      initialData,
      attachableType = "draft",
      attachableId = "",
      onChange,
      fullscreen = false,
      toolbar,
    },
    ref,
  ) {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const attachableTypeRef = useRef(attachableType);
    attachableTypeRef.current = attachableType;
    const attachableIdRef = useRef(attachableId);
    attachableIdRef.current = attachableId;

    useEffect(() => {
      if (!holderRef.current) return;

      let editor: EditorJS | null = null;
      let destroyed = false;

      async function init() {
        const [
          { default: EditorJSClass },
          { default: Header },
          { default: Quote },
          { default: NestedList },
          { default: Checklist },
          { default: CodeTool },
          { default: Delimiter },
          { default: ImageTool },
          { default: Embed },
          { default: Table },
          { default: Warning },
        ] = await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/quote"),
          import("@editorjs/list"),
          import("@editorjs/checklist"),
          import("@editorjs/code"),
          import("@editorjs/delimiter"),
          import("@editorjs/image"),
          import("@editorjs/embed"),
          import("@editorjs/table"),
          import("@editorjs/warning"),
        ]);

        if (destroyed) return;

        editor = new EditorJSClass({
          holder: holderRef.current!,
          data: initialData,
          placeholder: "Start writing...",
          tools: {
            header: {
              class: Header,
              config: { levels: [1, 2, 3, 4, 5, 6], defaultLevel: 2 },
            },
            quote: { class: Quote },
            list: { class: NestedList, inlineToolbar: true },
            checklist: { class: Checklist, inlineToolbar: true },
            code: { class: CodeTool },
            delimiter: { class: Delimiter },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const form = new FormData();
                    form.append("file", file);
                    form.append(
                      "attachable_type",
                      attachableTypeRef.current || "draft",
                    );
                    form.append("attachable_id", attachableIdRef.current || "");
                    form.append("category", "inline");

                    const res = await fetch("/api/attachments", {
                      method: "POST",
                      body: form,
                    });

                    if (!res.ok) throw new Error("Upload failed");

                    const attachment = await res.json();
                    return {
                      success: 1,
                      file: {
                        url: `/uploads/${attachment.filePath}`,
                      },
                    };
                  },
                },
              },
            },
            embed: {
              class: Embed,
              config: { services: { youtube: true } },
            },
            table: { class: Table, inlineToolbar: true },
            warning: { class: Warning, inlineToolbar: true },
          },
          onChange: async (api) => {
            if (onChangeRef.current) {
              const data = await api.saver.save();
              onChangeRef.current(data);
            }
          },
          onReady: () => {
            if (!destroyed) setReady(true);
          },
        });

        if (!destroyed) {
          editorRef.current = editor;
        }
      }

      init();

      return () => {
        destroyed = true;
        if (editor && typeof editor.destroy === "function") {
          editor.destroy();
        }
        editorRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getData = useCallback(async (): Promise<OutputData> => {
      if (!editorRef.current) {
        return { time: Date.now(), blocks: [] };
      }
      return editorRef.current.save();
    }, []);

    const setData = useCallback(async (data: OutputData): Promise<void> => {
      if (!editorRef.current) return;
      await editorRef.current.render(data);
    }, []);

    useImperativeHandle(ref, () => ({ getData, setData }), [getData, setData]);

    if (fullscreen) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-base-100">
          {toolbar && (
            <>
              <div className="navbar min-h-0 border-b border-base-300 px-4 py-2">
                <div className="flex-1">{toolbar.left}</div>
                <div className="flex items-center gap-2">{toolbar.right}</div>
              </div>
              {toolbar.bottom}
            </>
          )}
          <div
            className={cn(
              "mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6",
              !ready && "opacity-0",
            )}
            ref={holderRef}
          />
        </div>
      );
    }

    return (
      <div
        className={cn("min-h-[200px]", !ready && "opacity-0")}
        ref={holderRef}
      />
    );
  },
);

export default EditorWrapper;
