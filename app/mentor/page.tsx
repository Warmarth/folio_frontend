"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function MentorRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = name.trim().length > 0 && emailValid;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    if (!token) {
      console.log("No access token");
      return;
    }

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!bio.trim()) {
      setError("Please enter a bio.");
      return;
    }
    setLoading(true);

    try {
      let imageUrl: string | undefined;

      if (image) {
        const imageFormData = new FormData();
        imageFormData.append("image", image);

        const uploadResponse = await fetch(`${API_URL}/api/upload_image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload image");
        }

        imageUrl = uploadData.image_url;
      }

      const response = await fetch(`${API_URL}/api/mentors_create_profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          expertise: expertise.trim(),
          image_url: imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || data.message || "Failed to create mentor account.",
        );
        return;
      }

      setSuccess("Mentor account created successfully.");
      setTimeout(() => {
        router.push("/mentor/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Mentor registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3efe3] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl bg-white border border-black/[0.06] rounded-md p-10">
        <div className="mb-9">
          <h1 className="text-2xl font-serif text-[#1f1b16] tracking-tight">
            Build your Profile
          </h1>
          <p className="mt-1.5 text-sm text-black/45">
            Create your Folio mentor profile and help learners develop practical
            skills.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 border border-green-100 px-4 py-2.5 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 md:gap-10"
        >
          {/* Left rail — photo */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-black/60">
              Profile image
            </label>

            <div className="w-full aspect-square rounded-md border border-black/[0.06] bg-[#f3efe3] flex items-center justify-center overflow-hidden transition-colors">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-black/25 text-center px-4">
                  No image selected
                </span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-black/5 file:text-black/60 hover:file:bg-black/10 file:transition-colors"
            />
          </div>

          {/* Right side — fields */}
          <div className="space-y-7">
            {/* Identity row */}
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="text-xs font-medium text-black/40 mb-1 col-span-full">
                Identity
              </legend>

              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-black/60 mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-black/[0.08] rounded-md px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-black/30 focus:ring-2 focus:ring-black/[0.04]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-black/60 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={`w-full border rounded-md px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-black/[0.04] ${
                    email.length === 0
                      ? "border-black/[0.08] focus:border-black/30"
                      : emailValid
                        ? "border-green-200 focus:border-green-300"
                        : "border-red-200 focus:border-red-300"
                  }`}
                />
                {email.length > 0 && !emailValid && (
                  <p className="mt-1 text-xs text-red-500">
                    Enter a valid email
                  </p>
                )}
              </div>
            </fieldset>

            <hr className="border-black/[0.06]" />

            {/* Background */}
            <fieldset className="space-y-5">
              <legend className="text-xs font-medium text-black/40 mb-1">
                Your background
              </legend>

              <div>
                <label
                  htmlFor="expertise"
                  className="block text-xs font-medium text-black/60 mb-1.5"
                >
                  Expertise
                </label>
                <input
                  id="expertise"
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="Python, AI, Backend Development"
                  maxLength={500}
                  className="w-full border border-black/[0.08] rounded-md px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-black/30 focus:ring-2 focus:ring-black/[0.04]"
                />
                <p className="mt-1 text-xs text-black/35">
                  This is the first thing learners see — be specific.
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-xs font-medium text-black/60 mb-1.5"
                >
                  About you
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell learners about your experience..."
                  rows={4}
                  maxLength={500}
                  className="w-full border border-black/[0.08] rounded-md px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-black/30 focus:ring-2 focus:ring-black/[0.04] resize-y"
                />
                <p
                  className={`mt-1 text-xs transition-colors ${bio.length > 450 ? "text-red-400" : "text-black/35"}`}
                >
                  {bio.length}/500
                </p>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-[#1f1b16] text-[#f3efe3] px-5 py-2.5 rounded-md text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            >
              {loading ? "Creating mentor account..." : "Create Mentor Account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
