#!/usr/bin/env bash
#
# Safely resizes/re-encodes every image under a folder (e.g. downloads/opportunities-3) and
# normalises the extension to lowercase ".jpg" — the name the app requests (see
# app/shared/utils/formatter/image-url.ts normalizeFileName).
#
#   npm run images:optimize -- downloads/opportunities-3            # backup + optimise
#   npm run images:optimize -- downloads/opportunities-3 --dry-run  # show what would change
#   npm run images:optimize -- downloads/opportunities-3 --no-backup
#
# Per image: auto-orient, strip metadata, shrink to fit 1080x1080 (never upscales), JPEG quality 82.
#
# Safety rules (an earlier one-liner deleted every .jpg because input and output were the same path):
#   - the whole folder is copied to <folder>.backup-<timestamp> first, unless --no-backup
#   - output is written to a temp file and checked with `magick identify` before anything is replaced
#   - the original is only removed after the new file is verified, and never if it IS the output
#   - an existing, different image at the target name is never overwritten (skipped with a warning)
#   - a JPEG is only replaced if the result is at least 5% smaller — otherwise the original bytes are kept
#     (only renamed), so re-running never stacks lossy re-encodes for no real gain
#
set -euo pipefail

TARGET=""
DRY_RUN=false
BACKUP=true
for arg in "$@"; do
  case "$arg" in
    --dry-run)   DRY_RUN=true ;;
    --no-backup) BACKUP=false ;;
    -*)          echo "Unknown option: $arg" >&2; exit 1 ;;
    *)           TARGET="$arg" ;;
  esac
done

if [[ -z "$TARGET" || ! -d "$TARGET" ]]; then
  echo "Usage: $0 <folder> [--dry-run] [--no-backup]" >&2
  exit 1
fi
command -v magick >/dev/null || { echo "ImageMagick 'magick' not found (brew install imagemagick)" >&2; exit 1; }

# File size in bytes (macOS stat, then GNU stat).
size_of() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1"; }
# Bytes -> "1.23 MB" / "456 KB".
human() { awk -v b="$1" 'BEGIN { if (b >= 1048576) printf "%.2f MB", b/1048576; else printf "%.0f KB", b/1024 }'; }

if $BACKUP && ! $DRY_RUN; then
  BACKUP_DIR="${TARGET%/}.backup-$(date +%Y%m%d-%H%M%S)"
  echo "Backing up $TARGET -> $BACKUP_DIR"
  cp -R "$TARGET" "$BACKUP_DIR"
fi

total_before=0; total_after=0; processed=0; renamed_only=0; skipped=0; failed=0

while IFS= read -r -d '' file; do
  dir=$(dirname "$file")
  base=$(basename "$file")
  output="$dir/${base%.*}.jpg"
  before=$(size_of "$file")

  # A *different* file already sits at the target name (e.g. "Foo.png" next to "Foo.jpg") — never overwrite it.
  # `-ef` is true when both paths are the same file, which covers case-only renames on case-insensitive disks.
  if [[ -e "$output" && ! "$file" -ef "$output" ]]; then
    echo "SKIP  $base : target $(basename "$output") already exists"
    skipped=$((skipped + 1))
    continue
  fi

  if $DRY_RUN; then
    echo "WOULD $base : $(human "$before") -> $(basename "$output")"
    continue
  fi

  tmp="$dir/.optimize-tmp-$$-${base%.*}.jpg"
  if ! magick "$file" -auto-orient -strip -resize "1080x1080>" -quality 82 "$tmp" 2>/dev/null \
     || ! magick identify "$tmp" >/dev/null 2>&1; then
    rm -f "$tmp"
    echo "FAIL  $base : could not convert — original left untouched"
    failed=$((failed + 1))
    continue
  fi
  after=$(size_of "$tmp")

  # Re-encoding an already-optimised JPEG saves next to nothing and costs a generation of quality —
  # keep the original bytes unless the new file is at least 5% smaller.
  ext=$(echo "${base##*.}" | tr '[:upper:]' '[:lower:]')
  if [[ ( "$ext" == "jpg" || "$ext" == "jpeg" ) && $((after * 100)) -ge $((before * 95)) ]]; then
    rm -f "$tmp"
    if [[ "$file" != "$output" ]]; then
      # Two-step rename so case-only renames (Foo.JPG -> Foo.jpg) work on case-insensitive disks.
      mv "$file" "$file.optimize-rename-$$" && mv "$file.optimize-rename-$$" "$output"
    fi
    echo "KEEP  $(basename "$output") : $(human "$before") -> $(human "$before") (already optimal$( [[ "$file" != "$output" ]] && echo ", renamed from $base"))"
    total_before=$((total_before + before)); total_after=$((total_after + before))
    renamed_only=$((renamed_only + 1))
    continue
  fi

  # Verified new file in hand: remove the original (it may be the same path as the output), then move into place.
  rm -f "$file"
  mv "$tmp" "$output"
  echo "OK    $(basename "$output") : $(human "$before") -> $(human "$after")$( [[ "$base" != "$(basename "$output")" ]] && echo "   (was $base)")"
  total_before=$((total_before + before)); total_after=$((total_after + after))
  processed=$((processed + 1))
done < <(find "$TARGET" -type f \( -iname "*.png" -o -iname "*.jpeg" -o -iname "*.jpg" \) ! -name ".optimize-tmp-*" -print0 | sort -z)

echo
if $DRY_RUN; then
  echo "Dry run — nothing changed. Skipped (name clash): $skipped"
else
  echo "Optimised: $processed | kept original (already optimal): $renamed_only | skipped: $skipped | failed: $failed"
  echo "Total: $(human "$total_before") -> $(human "$total_after")"
  $BACKUP && echo "Backup: $BACKUP_DIR (delete it once you've checked the results)"
fi
