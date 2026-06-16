def split_caption_and_hashtags(desc: str) -> tuple:
    if not desc:
        return "", ""
    import re
    tags = re.findall(r'#[^\s#]+', desc)
    hashtags = " ".join(tags)
    
    clean_caption = re.sub(r'#[^\s#]+', '', desc)
    clean_caption = re.sub(r'\s+', ' ', clean_caption).strip()
    
    return clean_caption, hashtags

def test_split():
    # Test case 1: Standard caption and hashtags
    desc1 = "Hom nay troi dep qua #trending #fyp #vlog"
    caption1, tags1 = split_caption_and_hashtags(desc1)
    assert caption1 == "Hom nay troi dep qua"
    assert tags1 == "#trending #fyp #vlog"
    
    # Test case 2: Concatenated hashtags (no spaces in between)
    desc2 = "Mot ngay lam viec nang suat#work#daily#life"
    caption2, tags2 = split_caption_and_hashtags(desc2)
    assert caption2 == "Mot ngay lam viec nang suat"
    assert tags2 == "#work #daily #life"
    
    # Test case 3: No hashtags
    desc3 = "Chi co caption don thuan."
    caption3, tags3 = split_caption_and_hashtags(desc3)
    assert caption3 == "Chi co caption don thuan."
    assert tags3 == ""
    
    # Test case 4: Only hashtags
    desc4 = "#hashtag1 #hashtag2#hashtag3"
    caption4, tags4 = split_caption_and_hashtags(desc4)
    assert caption4 == ""
    assert tags4 == "#hashtag1 #hashtag2 #hashtag3"
    
    print("All tests passed successfully!")

if __name__ == "__main__":
    test_split()
