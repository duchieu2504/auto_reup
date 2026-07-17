import os
import tempfile
import uuid

def get_safe_boxblur_params(w, h, max_blur=15):
    """Giới hạn radius boxblur không được quá nhỏ (>= 0) và không quá lớn so với kích thước vùng."""
    blur_x = min(max_blur, int(w / 4))
    blur_y = min(max_blur, int(h / 4))
    blur_x = max(1, blur_x)
    blur_y = max(1, blur_y)
    return f"{blur_x}:{blur_y}"

class FFmpegFilterBuilder:
    def __init__(self, config, video_w, video_h):
        self.config = config
        self.video_w = video_w
        self.video_h = video_h
        
        self.vf_filters = []
        self.complex_filters = []
        self.current_v_in = "[0:v]"
        
        self.subs_input_idx = -1
        self.ass_file = None
        self.wm_image_idx = -1
        self.tts_idx = -1
        self.bgm_idx = 0
        
        # Keep track of temporary files generated that need cleanup
        self.temp_files = []

    def build_basic_filters(self):
        if self.config.flip_video:
            self.vf_filters.append("hflip")
        if self.config.opt_zoom:
            self.vf_filters.append("crop=iw/1.02:ih/1.02,scale=iw:ih")
        if self.config.opt_color:
            self.vf_filters.append("eq=brightness=0.02:contrast=1.05")
        if self.config.opt_noise:
            self.vf_filters.append("noise=alls=1:allf=t+u")
            
    def build_text_watermark(self):
        if self.config.watermark_type == "text" and self.config.watermark_text:
            text_color = self.config.watermark_color.replace('#', '0x')
            opacity_val = self.config.watermark_opacity / 100.0
            
            import platform
            if platform.system() == "Windows":
                font_path = "C:/Windows/Fonts/arial.ttf"
            else:
                font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
            
            fonts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data/fonts"))
            if self.config.subtitle_font_family != "Liberation Sans" and os.path.exists(fonts_dir):
                for f in os.listdir(fonts_dir):
                    if os.path.splitext(f)[0] == self.config.subtitle_font_family:
                        font_path = os.path.join(fonts_dir, f).replace("\\", "/")
                        break
            
            wm_file = os.path.join(tempfile.gettempdir(), f"wm_{uuid.uuid4().hex}.txt")
            with open(wm_file, "w", encoding="utf-8") as f:
                f.write(self.config.watermark_text)
            self.temp_files.append(wm_file)
                
            wm_file_esc = wm_file.replace('\\', '/').replace(':', '\\:')
            font_path_esc = font_path.replace('\\', '/').replace(':', '\\:')
            
            wm_real_size = int(float(self.config.watermark_size) * (self.video_h / 540.0) * 1.5)
            drawtext_filter = f"drawtext=fontfile='{font_path_esc}':textfile='{wm_file_esc}':fontcolor={text_color}@{opacity_val}:fontsize={wm_real_size}:x=(w-text_w)*{self.config.watermark_x}/100:y=(h-text_h)*{self.config.watermark_y}/100"
            self.vf_filters.append(drawtext_filter)

    def apply_vf_filters(self):
        if self.vf_filters:
            vf_str = ",".join(self.vf_filters)
            self.complex_filters.append(f"{self.current_v_in}{vf_str}[vfiltered]")
            self.current_v_in = "[vfiltered]"

    def build_masks(self):
        if self.config.mask_enabled and self.config.masks:
            filter_parts = []
            for i, mask in enumerate(self.config.masks):
                # Ensure mask is a dictionary (compatibility layer if it's parsed as Pydantic object)
                if hasattr(mask, 'dict'):
                    mask = mask.dict()
                    
                m_x = mask.get("x", 10.0)
                m_y = mask.get("y", 10.0)
                m_w = mask.get("width", 20.0)
                m_h = mask.get("height", 15.0)
                m_type = mask.get("type", "color")
                m_color = mask.get("color", "#000000")

                crop_w = self.video_w * m_w / 100.0
                crop_h = self.video_h * m_h / 100.0

                out_label = f"[vmasked_{i}]"
                if m_type == "blur":
                    blur_params = get_safe_boxblur_params(crop_w, crop_h, 15)
                    part = f"{self.current_v_in}split[vsplitbase_{i}][vblur_{i}];[vblur_{i}]crop=w=iw*{m_w}/100:h=ih*{m_h}/100:x=iw*{m_x}/100:y=ih*{m_y}/100,boxblur={blur_params}[blurred_{i}];[vsplitbase_{i}][blurred_{i}]overlay=x=W*{m_x}/100:y=H*{m_y}/100{out_label}"
                elif m_type == "noise":
                    blur_params = get_safe_boxblur_params(crop_w, crop_h, 5)
                    part = f"{self.current_v_in}split[vsplitbase_{i}][vnoise_{i}];[vnoise_{i}]crop=w=iw*{m_w}/100:h=ih*{m_h}/100:x=iw*{m_x}/100:y=ih*{m_y}/100,noise=alls=50:allf=t+u,boxblur={blur_params}[noisy_{i}];[vsplitbase_{i}][noisy_{i}]overlay=x=W*{m_x}/100:y=H*{m_y}/100{out_label}"
                else:
                    color_hex = m_color.replace('#', '0x')
                    part = f"{self.current_v_in}drawbox=x=iw*{m_x}/100:y=ih*{m_y}/100:w=iw*{m_w}/100:h=ih*{m_h}/100:color={color_hex}:t=fill{out_label}"
                
                filter_parts.append(part)
                self.current_v_in = out_label
            
            self.complex_filters.append(";".join(filter_parts))

    def finalize_vbase(self):
        if self.complex_filters:
            if self.current_v_in != "[vbase]":
                self.complex_filters.append(f"{self.current_v_in}copy[vbase]")
        else:
            self.complex_filters.append(f"{self.current_v_in}copy[vbase]")
        self.current_v_in = "[vbase]"

    def build_subtitle_overlay(self):
        if self.subs_input_idx != -1:
            self.complex_filters.append(f"{self.current_v_in}[{self.subs_input_idx}:v]overlay=x=0:y=0[vsub_out]")
            self.current_v_in = "[vsub_out]"
        elif self.ass_file is not None:
            ass_path_esc = self.ass_file.replace('\\', '/').replace(':', '\\:')
            self.complex_filters.append(f"{self.current_v_in}ass='{ass_path_esc}'[vsub_out]")
            self.current_v_in = "[vsub_out]"

    def build_image_watermark(self):
        if self.config.watermark_type == "image" and self.wm_image_idx != -1:
            opacity_val = self.config.watermark_opacity / 100.0
            self.complex_filters.append(f"[{self.wm_image_idx}:v]format=rgba,colorchannelmixer=aa={opacity_val},scale=iw*{self.config.watermark_size}/100:-1[wm];{self.current_v_in}[wm]overlay=x=(W-w)*{self.config.watermark_x}/100:y=(H-h)*{self.config.watermark_y}/100[vout]")
            self.current_v_in = "[vout]"
        else:
            self.complex_filters.append(f"{self.current_v_in}copy[vout]")
            self.current_v_in = "[vout]"

    def build_audio_filters(self):
        bg_audio_label = f"[{self.bgm_idx}:a]"
        
        if self.tts_idx != -1:
            bg_vol_float = self.config.bg_volume / 100.0
            if self.config.opt_pitch:
                audio_filter = f"{bg_audio_label}volume={bg_vol_float},asetrate=44100*1.02,atempo=1/1.02[bg];[{self.tts_idx}:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0[aout]"
            else:
                audio_filter = f"{bg_audio_label}volume={bg_vol_float}[bg];[{self.tts_idx}:a]volume=1.0[tts];[bg][tts]amix=inputs=2:duration=longest:dropout_transition=2:normalize=0[aout]"
            self.complex_filters.append(audio_filter)
            return "[aout]"
        else:
            if self.config.opt_pitch:
                audio_filter = f"{bg_audio_label}asetrate=44100*1.02,atempo=1/1.02[aout]"
                self.complex_filters.append(audio_filter)
                return "[aout]"
            return "0:a?" if self.bgm_idx == 0 else f"{self.bgm_idx}:a?"

    def get_filter_complex_string(self):
        return ";".join(self.complex_filters)

    def cleanup(self):
        for temp_file in self.temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception:
                    pass
