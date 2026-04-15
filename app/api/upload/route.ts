import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// POST /api/upload — upload image/video to Cloudinary
export async function POST(req: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { data, resource_type = "image", folder = "odycard" } = await req.json();
    if (!data) return NextResponse.json({ error: "data (base64) is required" }, { status: 400 });

    const result = await cloudinary.uploader.upload(data, {
      resource_type,
      folder,
      transformation: resource_type === "image"
        ? [{ quality: "auto", fetch_format: "auto", width: 1200, crop: "limit" }]
        : [],
    });

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("POST /api/upload:", e);
    return NextResponse.json({ error: "Upload failed: " + (err.message || "unknown") }, { status: 500 });
  }
}

// Vercel has a 4.5MB body limit by default — increase for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
