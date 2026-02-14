import { useParams } from "react-router";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Post</h1>
      <p className="text-base-content/60 mt-2">Editing post {id}.</p>
    </div>
  );
}
