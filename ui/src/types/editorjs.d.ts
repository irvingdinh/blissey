/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@editorjs/editorjs" {
  export interface OutputBlockData {
    id?: string;
    type: string;
    data: Record<string, any>;
  }

  export interface OutputData {
    time?: number;
    blocks: OutputBlockData[];
    version?: string;
  }

  export interface API {
    saver: {
      save(): Promise<OutputData>;
    };
  }

  export interface EditorConfig {
    holder?: string | HTMLElement;
    data?: OutputData;
    placeholder?: string;
    tools?: Record<string, any>;
    onChange?: (api: API, event: CustomEvent) => void;
    onReady?: () => void;
  }

  export default class EditorJS {
    constructor(config: EditorConfig);
    save(): Promise<OutputData>;
    render(data: OutputData): Promise<void>;
    destroy(): void;
    isReady: Promise<void>;
  }
}

declare module "@editorjs/header" {
  const Header: any;
  export default Header;
}

declare module "@editorjs/quote" {
  const Quote: any;
  export default Quote;
}

declare module "@editorjs/list" {
  const NestedList: any;
  export default NestedList;
}

declare module "@editorjs/checklist" {
  const Checklist: any;
  export default Checklist;
}

declare module "@editorjs/code" {
  const CodeTool: any;
  export default CodeTool;
}

declare module "@editorjs/delimiter" {
  const Delimiter: any;
  export default Delimiter;
}

declare module "@editorjs/image" {
  const ImageTool: any;
  export default ImageTool;
}

declare module "@editorjs/embed" {
  const Embed: any;
  export default Embed;
}

declare module "@editorjs/table" {
  const Table: any;
  export default Table;
}

declare module "@editorjs/warning" {
  const Warning: any;
  export default Warning;
}
