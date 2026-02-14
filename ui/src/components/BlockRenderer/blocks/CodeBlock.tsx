interface CodeBlockProps {
  data: { code: string };
}

export function CodeBlock({ data }: CodeBlockProps) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-base-200 p-4">
      <code className="text-sm font-mono whitespace-pre">{data.code}</code>
    </pre>
  );
}
