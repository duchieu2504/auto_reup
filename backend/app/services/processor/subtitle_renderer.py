import os
import uuid
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import pysrt

def hex_to_rgba(hex_color: str, opacity: float = 1.0) -> tuple:
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return (255, 255, 255, int(opacity * 255))
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    return (r, g, b, int(opacity * 255))

class SubtitleRenderer:
    def __init__(self, video_width: int, video_height: int, font_family: str, font_size: int, 
                 text_color: str, bg_color: str, bg_opacity: float, margin_v: float, 
                 bg_padding: float, style: str = "classic"):
        self.video_width = video_width
        self.video_height = video_height
        self.font_family = font_family
        self.text_color = hex_to_rgba(text_color)
        self.bg_color = hex_to_rgba(bg_color, bg_opacity / 100.0)
        self.margin_v = margin_v  # percentage from bottom
        self.style = style
        
        # Scale parameters according to video height (reference 420p which matches the UI preview height)
        self.scale_factor = video_height / 420.0
        self.font_size = max(1, int(font_size * self.scale_factor))
        self.bg_padding_x = max(0, int(bg_padding * self.scale_factor * 5))
        self.bg_padding_y = max(0, int(bg_padding * self.scale_factor * 3))
        
        self.font_path = self._get_font_path(font_family)
        try:
            self.font = ImageFont.truetype(self.font_path, self.font_size)
        except Exception:
            # Fallback
            self.font = ImageFont.load_default()

    def _get_font_path(self, font_name: str) -> str:
        fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/fonts"))
        if os.path.exists(fonts_dir):
            for f in os.listdir(fonts_dir):
                if os.path.splitext(f)[0] == font_name:
                    return os.path.join(fonts_dir, f)
        # Default Linux font fallback
        return "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"

    def _format_time(self, t) -> str:
        """Convert pysrt time to seconds float"""
        return t.hours * 3600 + t.minutes * 60 + t.seconds + t.milliseconds / 1000.0

    def draw_rounded_rectangle(self, draw, xy, radius, fill):
        """Helper to draw rounded rectangle"""
        x1, y1, x2, y2 = xy
        draw.rectangle(
            [(x1, y1 + radius), (x2, y2 - radius)],
            fill=fill
        )
        draw.rectangle(
            [(x1 + radius, y1), (x2 - radius, y2)],
            fill=fill
        )
        draw.pieslice([x1, y1, x1 + radius * 2, y1 + radius * 2], 180, 270, fill=fill)
        draw.pieslice([x2 - radius * 2, y1, x2, y1 + radius * 2], 270, 360, fill=fill)
        draw.pieslice([x1, y2 - radius * 2, x1 + radius * 2, y2], 90, 180, fill=fill)
        draw.pieslice([x2 - radius * 2, y2 - radius * 2, x2, y2], 0, 90, fill=fill)

    def draw_cloud_background(self, draw, xy, fill):
        """Helper to draw wavy cloud background"""
        x1, y1, x2, y2 = xy
        w = x2 - x1
        h = y2 - y1
        r = h * 0.4
        
        # Base rounded rect
        self.draw_rounded_rectangle(draw, xy, int(r), fill)
        
        # Add random looking circular bumps (clouds)
        bumps = [
            (x1 + w*0.2, y1 - r*0.5, r*1.2),
            (x1 + w*0.5, y1 - r*0.8, r*1.5),
            (x1 + w*0.8, y1 - r*0.4, r*1.1),
            (x1 + w*0.3, y2 - r*0.5, r*1.3),
            (x1 + w*0.7, y2 - r*0.3, r*1.2)
        ]
        
        for bx, by, br in bumps:
            draw.ellipse([bx - br, by - br, bx + br, by + br], fill=fill)

    def generate_subtitle_sequence(self, srt_file: str, output_dir: str) -> str:
        """
        Parses SRT, generates PNGs, creates FFmpeg concat file.
        Returns the path to the concat.txt file.
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
            
        subs = pysrt.open(srt_file, encoding='utf-8')
        concat_file_path = os.path.join(output_dir, "subs_concat.txt")
        
        with open(concat_file_path, "w", encoding="utf-8") as f:
            last_end_time = 0.0
            
            for i, sub in enumerate(subs):
                start_time = self._format_time(sub.start)
                end_time = self._format_time(sub.end)
                
                # If there's a gap before this subtitle, add a transparent placeholder duration
                if start_time > last_end_time:
                    duration = start_time - last_end_time
                    # We can use a 1x1 transparent PNG or simply missing file in some cases, but FFmpeg concat needs a file.
                    # We will create a single empty transparent frame
                    empty_png = os.path.join(output_dir, "empty.png")
                    if not os.path.exists(empty_png):
                        img = Image.new('RGBA', (self.video_width, self.video_height), (0, 0, 0, 0))
                        img.save(empty_png, format="PNG")
                    
                    f.write(f"file '{empty_png}'\n")
                    f.write(f"duration {duration:.3f}\n")
                
                text = sub.text.replace("\n", " ")
                png_path = os.path.join(output_dir, f"sub_{i:04d}.png")
                self._create_subtitle_frame(text, png_path)
                
                duration = end_time - start_time
                f.write(f"file '{png_path}'\n")
                f.write(f"duration {duration:.3f}\n")
                
                last_end_time = end_time
                
            # Final empty frame to clear the last subtitle
            empty_png = os.path.join(output_dir, "empty.png")
            f.write(f"file '{empty_png}'\n")
            
        return concat_file_path

    def _create_subtitle_frame(self, text: str, output_path: str):
        # Create an image covering the whole video frame to preserve absolute positioning
        img = Image.new('RGBA', (self.video_width, self.video_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Calculate text bounding box
        try:
            bbox = draw.textbbox((0, 0), text, font=self.font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
        except AttributeError:
            text_w, text_h = draw.textsize(text, font=self.font)
            
        # Coordinates
        x_center = self.video_width / 2
        
        # Bottom margin is calculated from the bottom of the video
        y_bottom = self.video_height - (self.video_height * self.margin_v / 100.0)
        y_top = y_bottom - text_h
        
        text_x = x_center - text_w / 2
        text_y = y_top
        
        box_x1 = text_x - self.bg_padding_x
        box_y1 = text_y - self.bg_padding_y
        box_x2 = text_x + text_w + self.bg_padding_x
        box_y2 = text_y + text_h + self.bg_padding_y

        xy = [box_x1, box_y1, box_x2, box_y2]
        
        shadow_offset = max(1, int(1 * self.scale_factor))

        if self.style == "neon":
            # Neon style: glow effect
            glow_img = Image.new('RGBA', (self.video_width, self.video_height), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow_img)
            
            # Draw semi-transparent dark background
            self.draw_rounded_rectangle(glow_draw, xy, 10, (0, 0, 0, int(self.bg_color[3]*0.8)))
            
            # Glow text
            glow_draw.text((text_x, text_y), text, font=self.font, fill=self.bg_color[:3] + (255,))
            glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=8))
            
            img.paste(glow_img, (0, 0), glow_img)
            
            # Draw sharp text over glow
            draw.text((text_x, text_y), text, font=self.font, fill=self.text_color)
            
        elif self.style == "cloud":
            self.draw_cloud_background(draw, xy, self.bg_color)
            # Add drop shadow to text
            draw.text((text_x + shadow_offset * 2, text_y + shadow_offset * 2), text, font=self.font, fill=(0,0,0,150))
            draw.text((text_x, text_y), text, font=self.font, fill=self.text_color)
            
        elif self.style == "rounded":
            self.draw_rounded_rectangle(draw, xy, int(15 * self.scale_factor), self.bg_color)
            draw.text((text_x + shadow_offset, text_y + shadow_offset), text, font=self.font, fill=(0,0,0,150))
            draw.text((text_x, text_y), text, font=self.font, fill=self.text_color)
            
        else: # Classic
            draw.rectangle(xy, fill=self.bg_color)
            draw.text((text_x + shadow_offset, text_y + shadow_offset), text, font=self.font, fill=(0,0,0,150))
            draw.text((text_x, text_y), text, font=self.font, fill=self.text_color)
            
        img.save(output_path, format="PNG")
