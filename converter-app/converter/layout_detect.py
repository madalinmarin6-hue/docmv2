"""Layout detection for document structure analysis using LayoutParser."""

import os

try:
    import layoutparser as lp
    HAS_LAYOUTPARSER = True
except ImportError:
    HAS_LAYOUTPARSER = False

from PIL import Image


# Layout element types
LAYOUT_TYPES = {
    "text": "Text",
    "title": "Title",
    "list": "List",
    "table": "Table",
    "figure": "Figure",
    "header": "Header",
    "footer": "Footer",
}


def detect_layout(image: Image.Image) -> list:
    """
    Detect document layout elements in a page image.
    Returns a list of detected regions with type and bounding box.
    
    Each region: {
        "type": str,       # text, title, table, figure, etc.
        "bbox": (x1, y1, x2, y2),
        "score": float,
    }
    """
    if not HAS_LAYOUTPARSER:
        # Fallback: return entire page as single text block
        w, h = image.size
        return [{"type": "text", "bbox": (0, 0, w, h), "score": 1.0}]

    try:
        # Use PubLayNet model for general document layout detection
        model = lp.Detectron2LayoutModel(
            config_path="lp://PubLayNet/faster_rcnn_R_50_FPN_3x/config",
            extra_config=["MODEL.ROI_HEADS.SCORE_THRESH_TEST", 0.5],
            label_map={0: "Text", 1: "Title", 2: "List", 3: "Table", 4: "Figure"},
        )

        layout = model.detect(image)

        regions = []
        for block in layout:
            region = {
                "type": block.type.lower() if block.type else "text",
                "bbox": (
                    int(block.block.x_1),
                    int(block.block.y_1),
                    int(block.block.x_2),
                    int(block.block.y_2),
                ),
                "score": float(block.score) if block.score else 1.0,
            }
            regions.append(region)

        # Sort by vertical position (top to bottom)
        regions.sort(key=lambda r: r["bbox"][1])
        return regions

    except Exception as e:
        # Fallback on error
        w, h = image.size
        return [{"type": "text", "bbox": (0, 0, w, h), "score": 1.0}]


def classify_page_regions(regions: list) -> dict:
    """
    Classify regions into document structure categories.
    Returns counts of each type.
    """
    counts = {}
    for r in regions:
        t = r["type"]
        counts[t] = counts.get(t, 0) + 1
    return counts


def has_tables(regions: list) -> bool:
    """Check if the page contains table regions."""
    return any(r["type"] == "table" for r in regions)


def has_figures(regions: list) -> bool:
    """Check if the page contains figure/image regions."""
    return any(r["type"] == "figure" for r in regions)
