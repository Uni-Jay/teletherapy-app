"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addDocument } from "@/app/actions/therapist";

export function DocumentUpload({ userId }: { userId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState("licence");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return setError("Choose a file to upload.");
    if (file.size > 10 * 1024 * 1024) return setError("Files must be under 10 MB.");
    if (!/^(application\/pdf|image\/)/.test(file.type)) return setError("Upload a PDF or an image.");
    setBusy(true);
    setError("");
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${kind}-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("therapist-docs").upload(path, file);
    if (upErr) {
      setBusy(false);
      return setError("Upload failed. Please try again.");
    }
    const res = await addDocument(kind, title || file.name, path);
    setBusy(false);
    if (res.error) return setError(res.error);
    setTitle("");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="kind">Document type</label>
        <select id="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="licence">Professional licence (required)</option>
          <option value="qualification">Qualification / degree</option>
          <option value="certification">Certification</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="title">Name of document</label>
        <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MDCN practising licence 2026" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="file">File (PDF or image, up to 10 MB)</label>
        <input id="file" name="file" type="file" accept="application/pdf,image/*" className="input" />
      </div>
      {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div>
        <button className="btn-primary" disabled={busy}>{busy ? "Uploading…" : "Upload document"}</button>
      </div>
    </form>
  );
}
