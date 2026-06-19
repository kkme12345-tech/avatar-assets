from PIL import Image
import os

def check_alignment():
    base_dir = r"C:\Users\user\Desktop\anti專案"
    boy_path = os.path.join(base_dir, "boy_base.png")
    girl_path = os.path.join(base_dir, "girl_base.png")
    equip_path = os.path.join(base_dir, "1級.PNG")
    
    # Load images
    boy_img = Image.open(boy_path).convert("RGBA")
    girl_img = Image.open(girl_path).convert("RGBA")
    equip_img = Image.open(equip_path).convert("RGBA")
    
    # Ensure sizes match
    if boy_img.size != equip_img.size:
        print(f"Size mismatch: boy {boy_img.size} vs equip {equip_img.size}")
        return
        
    width, height = boy_img.size
    
    # We create a new blank image for the extracted equipment
    extracted_equip = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    # Process pixels
    boy_data = boy_img.load()
    equip_data = equip_img.load()
    ext_data = extracted_equip.load()
    
    for y in range(height):
        for x in range(width):
            b_pixel = boy_data[x, y]
            e_pixel = equip_data[x, y]
            
            # If pixels are different and not fully transparent
            if b_pixel != e_pixel and e_pixel[3] > 0:
                ext_data[x, y] = e_pixel
                
    # Composite extracted equipment over girl base
    girl_test = Image.alpha_composite(girl_img, extracted_equip)
    
    # Save the output to artifact directory
    artifact_dir = r"C:\Users\user\.gemini\antigravity\brain\df884708-b836-45e8-a81e-b70e03e66583\scratch"
    os.makedirs(artifact_dir, exist_ok=True)
    out_path = os.path.join(artifact_dir, "girl_test_1級.png")
    ext_path = os.path.join(artifact_dir, "extracted_1級.png")
    
    girl_test.save(out_path)
    extracted_equip.save(ext_path)
    
    print(f"Saved test composite to {out_path}")
    print(f"Saved extracted equip to {ext_path}")

if __name__ == '__main__':
    check_alignment()
