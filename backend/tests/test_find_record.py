import xml.etree.ElementTree as ET
import re

def parse_bounds(bounds_str):
    match = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', bounds_str)
    if match:
        return [int(x) for x in match.groups()]
    return None

tree = ET.parse('/tmp/window_dump2.xml')
screen_width = 720
screen_height = 1480
x_center = screen_width / 2

for node in tree.iter():
    bounds_str = node.get("bounds")
    if not bounds_str: continue
    bounds = parse_bounds(bounds_str)
    if not bounds: continue
    
    left, top, right, bottom = bounds
    width = right - left
    height = bottom - top
    
    # Conditions:
    # 1. Spans across horizontal center
    if left < x_center < right:
        # 2. In the bottom half
        if top > screen_height / 2:
            # 3. Large enough (Record button is usually big)
            if width > 100 and height > 100:
                print(f"FOUND RECORD BUTTON CANDIDATE:")
                print(f"Class: {node.get('class')}")
                print(f"ID: {node.get('resource-id')}")
                print(f"Bounds: {bounds}")
                print(f"Center Y: {(top + bottom) / 2}")
                print("-" * 30)
