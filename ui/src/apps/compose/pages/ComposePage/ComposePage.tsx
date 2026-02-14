import { useRef } from "react";
import { useNavigate } from "react-router";

import type { EditorWrapperHandle } from "@/components/EditorWrapper";
import EditorWrapper from "@/components/EditorWrapper";

export default function ComposePage() {
  const navigate = useNavigate();
  const editorRef = useRef<EditorWrapperHandle>(null);

  return (
    <EditorWrapper
      ref={editorRef}
      fullscreen
      toolbar={{
        left: (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
        ),
        right: (
          <button className="btn btn-primary btn-sm" disabled>
            Publish
          </button>
        ),
      }}
    />
  );
}
