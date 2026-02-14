import { useParams } from "react-router";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">Post</h1>
      <p className="text-base-content/60 mt-2">Viewing post {id}.</p>
    </div>
  );
}
