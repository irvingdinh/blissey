interface CodeBlockProps {
  data: { code: string };
}

export function CodeBlock({ data }: CodeBlockProps) {
  return (
    <pre className="max-w-full overflow-x-auto rounded-lg bg-base-200 p-4">
      <code className="text-sm font-mono whitespace-pre break-words">
        {data.code}
      </code>
    </pre>
  );
}
