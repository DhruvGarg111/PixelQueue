import { useState } from "react";
import { commitUpload, presignUpload } from "../api";
import { getErrorMessage } from "../utils/error";

const getImageDimensions = async (file) => {
    const bitmap = await createImageBitmap(file);
    try {
        return { width: bitmap.width, height: bitmap.height };
    } finally {
        bitmap.close?.();
    }
};

const normalizeUploadError = (error) => getErrorMessage(error, "Upload failed");

/**
 * Handles single and batch image uploads with presigned S3 URLs.
 * Returns upload state and an `onUpload` handler for file inputs.
 */
export const useImageUpload = (projectId, { onComplete, onStatusChange }) => {
    const [uploading, setUploading] = useState(false);

    const onUpload = async (e) => {
        if (!projectId) return;

        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        onStatusChange?.(`Uploading ${files.length} image${files.length === 1 ? "" : "s"}...`);

        try {
            let uploadedCount = 0;
            const failures = [];

            for (let i = 0; i < files.length; i += 1) {
                const file = files[i];
                const contentType = file.type || "image/png";
                onStatusChange?.(`Uploading ${i + 1}/${files.length}: ${file.name}`);

                try {
                    const dims = await getImageDimensions(file);
                    const presigned = await presignUpload(projectId, file.name, contentType);

                    const putRes = await fetch(presigned.upload_url, {
                        method: "PUT",
                        headers: { "Content-Type": contentType },
                        body: file,
                    });
                    if (!putRes.ok) throw new Error(`upload failed (${putRes.status})`);

                    await commitUpload(projectId, {
                        object_key: presigned.object_key,
                        width: dims.width,
                        height: dims.height,
                    });
                    uploadedCount += 1;
                } catch (err) {
                    failures.push({ fileName: file.name, message: normalizeUploadError(err) });
                }
            }

            if (uploadedCount > 0) {
                onStatusChange?.(`Uploaded ${uploadedCount}/${files.length}. Loading task...`);
                await onComplete?.();
            }

            if (failures.length > 0) {
                const first = failures[0];
                const moreCount = failures.length - 1;
                const moreText = moreCount > 0 ? ` (+${moreCount} more)` : "";
                onStatusChange?.(
                    uploadedCount > 0
                        ? `Uploaded ${uploadedCount}/${files.length} images. Failed: ${first.fileName} (${first.message})${moreText}`
                        : `Upload failed: ${first.fileName} (${first.message})${moreText}`,
                );
            } else if (uploadedCount > 0) {
                onStatusChange?.(`Uploaded ${uploadedCount} image${uploadedCount === 1 ? "" : "s"} successfully.`);
            }
        } catch (err) {
            onStatusChange?.(normalizeUploadError(err));
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return { uploading, onUpload };
};
