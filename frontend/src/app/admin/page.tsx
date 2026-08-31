"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminProduct } from "@/lib/types";
import {
  approveProduct,
  getAdminProducts,
  rejectProduct,
} from "@/lib/api";
import Button from "@/components/ui/Button";
import ReviewPanel from "@/components/admin/ReviewPanel";
import UploadVideoForm from "@/components/admin/UploadVideoForm";

type Toast = { message: string; type: "success" | "error" } | null;

export default function AdminPage() {
  const [drafts, setDrafts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [awaitingAi, setAwaitingAi] = useState(false);
  const baselineCountRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadDrafts = useCallback(async (): Promise<number> => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getAdminProducts("pending_review");
      setDrafts(data);
      return data.length;
    } catch {
      setLoadError(
        "Could not load drafts. Check that NEXT_PUBLIC_API_URL is set to the backend URL."
      );
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Any save/approve/reject inside a panel refetches the list.
  const handleChanged = useCallback(() => {
    loadDrafts();
  }, [loadDrafts]);

  // After an upload, the AI draft takes ~10-30s. Poll until a NEW draft
  // appears (count increases) or a few attempts elapse.
  const handleUploaded = useCallback(() => {
    setAwaitingAi(true);
    let attempts = 0;
    // Capture the current draft count to detect the new row.
    baselineCountRef.current = drafts.length;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const count = await loadDrafts();
      if (
        baselineCountRef.current != null &&
        count > baselineCountRef.current
      ) {
        window.clearInterval(timer);
        setAwaitingAi(false);
        showToast("New AI draft is ready for review 🎉", "success");
      } else if (attempts >= 8) {
        window.clearInterval(timer);
        setAwaitingAi(false);
        showToast(
          "Draft may take a little longer — click Refresh if it doesn't appear.",
          "success"
        );
      }
    }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDrafts, showToast]);

  const errDetail = (err: unknown): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = (err as any)?.response?.data?.detail;
    return detail != null ? String(detail) : "Something went wrong";
  };

  const quickApprove = async (draft: AdminProduct) => {
    setBusyId(draft.id);
    try {
      await approveProduct(draft.id); // backend resolves tag price -> fallback
      showToast(`"${draft.title}" published 🎉`, "success");
      await loadDrafts();
    } catch (err) {
      showToast(errDetail(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const quickReject = async (draft: AdminProduct) => {
    if (!window.confirm(`Reject and delete "${draft.title}"?`)) return;
    setBusyId(draft.id);
    try {
      await rejectProduct(draft.id);
      showToast("Draft rejected", "success");
      await loadDrafts();
    } catch (err) {
      showToast(errDetail(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Review</h1>
          <p className="text-gray-600">
            Drafts awaiting review{" "}
            <span className="font-semibold text-indigo-600">
              ({loading ? "…" : drafts.length})
            </span>
          </p>
        </div>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Back to storefront
        </Link>
      </div>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Upload new product video — no Swagger needed */}
      <div className="mb-6">
        <UploadVideoForm onUploaded={handleUploaded} onToast={showToast} />
        {awaitingAi && (
          <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 px-4 py-3 rounded-lg">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-indigo-700 font-medium">
              AI is analyzing your video (extracting frames, reading the tag,
              generating the draft)… it will appear below automatically.
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-500">Loading drafts…</div>
      )}

      {!loading && loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {loadError}
        </div>
      )}

      {!loading && !loadError && drafts.length === 0 && !awaitingAi && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            No drafts awaiting review
          </h2>
          <p className="text-gray-600">
            Use the{" "}
            <span className="font-medium text-gray-800">
              Upload a product video
            </span>{" "}
            section above and your AI draft will appear here automatically.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {drafts.map((draft) => {
          const expanded = expandedId === draft.id;
          return (
            <div
              key={draft.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Summary row */}
              <div className="flex flex-col sm:flex-row gap-4 p-4">
                <div className="w-full sm:w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {draft.image_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.image_urls[0]}
                      alt={draft.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      🛍️
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {draft.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {draft.category} · {draft.color}
                    {draft.brand ? ` · ${draft.brand}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {draft.detected_tag_price != null && (
                      <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        Tag: ₹{draft.detected_tag_price}
                      </span>
                    )}
                    {draft.suggested_price_min != null &&
                      draft.suggested_price_max != null && (
                        <span className="text-gray-500">
                          Suggested: ₹{draft.suggested_price_min} – ₹
                          {draft.suggested_price_max}
                        </span>
                      )}
                    {draft.sizes && (
                      <span className="text-gray-500">Sizes: {draft.sizes}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedId(expanded ? null : draft.id)}
                  >
                    {expanded ? "Close" : "Review →"}
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === draft.id}
                    onClick={() => quickApprove(draft)}
                    title="Approve using the AI-detected tag price / suggestion"
                  >
                    {busyId === draft.id ? "…" : "Quick Approve"}
                  </Button>
                </div>
              </div>

              {expanded && (
                <ReviewPanel
                  product={draft}
                  onChanged={handleChanged}
                  onToast={showToast}
                />
              )}
            </div>
          );
        })}
      </div>

      {!loading && drafts.length > 0 && (
        <p className="mt-6 text-xs text-gray-400">
          Tip: use Quick Approve to publish instantly with the AI-suggested
          price, or Review → to edit every field first. Reject is available
          inside the review panel.
        </p>
      )}
    </div>
  );
}