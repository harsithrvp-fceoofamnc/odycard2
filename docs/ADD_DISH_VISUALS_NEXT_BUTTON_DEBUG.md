# Add Dish Visuals — Next Button Validation Summary

## Location
`app/owner/hotel/[restaurantId]/add-dish/visuals/page.tsx`

## Validation Condition

The Next button is **disabled** when:
```
isNextDisabled = !imageUrl || !hasValidYoutube || isUploadingImage
```

Where `hasValidYoutube = !!youtubeUrl && youtubeUrl.length > 0`

**Next is enabled only when ALL are true:**
- `imageUrl` is set (cropped base64 result)
- `youtubeUrl` is set (valid YouTube ID from "Upload")
- `isUploadingImage` is false

---

## State Flow

| State | Set By | Purpose |
|-------|--------|---------|
| `imageFile` | File selection | Raw file before crop |
| `imagePreview` | `URL.createObjectURL(file)` | Display in crop modal |
| `imageUrl` | `saveCrop` (Done button) | Final cropped base64; used for Next validation |
| `youtubeUrl` | `handleUploadVideo` (Upload button) | Extracted YouTube ID |
| `isUploadingImage` | During `getCroppedImg` | Blocks Next while processing |

---

## Most Likely Causes for Button Not Working

### 1. **croppedAreaPixelsRef is null** (most likely)
- `onCropComplete` sets `croppedAreaPixelsRef.current = area`
- If user clicks Done without moving the crop, the ref may never be set (depends on react-easy-crop firing on mount)
- `saveCrop` returns early: `if (!area || !src) return`
- Result: `imageUrl` never gets set → Next stays disabled

### 2. **youtubeUrl never set**
- User must paste link AND click "Upload"
- If they only paste and don't click Upload, `youtubeUrl` stays `null`

### 3. **YouTube regex mismatch**
- `extractYouTubeId` supports: `youtube.com/watch`, `youtube.com/embed`, `youtu.be`
- Non-standard URLs may not match

### 4. **isUploadingImage stuck** (unlikely)
- `setIsUploadingImage(false)` is in `finally` block
- Should always run

---

## Button JSX (always rendered)

```jsx
<button
  type="button"
  onClick={handleNext}
  disabled={isNextDisabled}
  className={...}
>
  Next
</button>
```

No conditional rendering—button is always visible.

---

## Debug Logging

Console logs (`[AddDish Visuals] Next button validation:`) show:
- `imageFile`, `imagePreview`, `imageUrl`, `youtubeUrl`
- `isUploadingImage`
- `hasImage`, `hasValidYoutube`, `isNextDisabled`
- `whyDisabled` — array of which condition(s) are blocking

Check the console after completing the flow to see the exact reason.
